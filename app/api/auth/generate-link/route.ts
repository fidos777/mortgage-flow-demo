/**
 * Qontrek Solar MCP Server - Agent Builder Compatible
 * 
 * This implements the Model Context Protocol (MCP) specification for OpenAI Agent Builder.
 * 
 * MCP Server Requirements:
 * 1. Streamable HTTP transport (POST for invoke, GET for schema)
 * 2. Tool discovery via list_tools
 * 3. Tool invocation via invoke
 * 4. Proper JSON-RPC 2.0 format
 * 
 * Endpoints:
 * - POST /api/mcp/solar - MCP JSON-RPC handler
 * - GET /api/mcp/solar - Health check / capability discovery
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// MCP Tool Definitions
const MCP_TOOLS = [
  {
    name: 'get_kpi_summary',
    description: 'Get solar payment recovery KPI summary including total recoverable amount, project counts, and recovery rates',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'get_critical_leads',
    description: 'Get critical leads that are overdue for payment recovery. Returns leads with outstanding amounts and days overdue.',
    inputSchema: {
      type: 'object',
      properties: {
        min_days_overdue: {
          type: 'number',
          description: 'Minimum days overdue to filter (default: 14)'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of leads to return (default: 10)'
        }
      },
      required: []
    }
  },
  {
    name: 'get_recovery_pipeline',
    description: 'Get the payment recovery pipeline broken down by stage (80%, 20%, Handover)',
    inputSchema: {
      type: 'object',
      properties: {
        stage: {
          type: 'string',
          description: 'Filter by specific stage: "80%", "20%", or "Handover"',
          enum: ['80%', '20%', 'Handover']
        }
      },
      required: []
    }
  },
  {
    name: 'get_recent_activity',
    description: 'Get recent payment recovery activity and timeline events',
    inputSchema: {
      type: 'object',
      properties: {
        days: {
          type: 'number',
          description: 'Number of days to look back (default: 7)'
        }
      },
      required: []
    }
  }
];

// Tool Handlers
async function handleGetKpiSummary() {
  const { data, error } = await supabase
    .from('v_payment_recovery_kpi')
    .select('*')
    .single();

  if (error) {
    console.error('KPI query error:', error);
    // Fallback to aggregation if view doesn't exist
    const { data: projects } = await supabase
      .from('solar_projects')
      .select('outstanding_balance, stage');
    
    if (projects) {
      const total = projects.reduce((sum, p) => sum + (p.outstanding_balance || 0), 0);
      return {
        total_recoverable: total,
        total_projects: projects.length,
        pending_80_count: projects.filter(p => p.stage === '80%').length,
        pending_20_count: projects.filter(p => p.stage === '20%').length,
        handover_count: projects.filter(p => p.stage === 'Handover').length,
        currency: 'MYR'
      };
    }
  }

  return data || {
    total_recoverable: 0,
    total_projects: 0,
    message: 'No data available'
  };
}

async function handleGetCriticalLeads(params: { min_days_overdue?: number; limit?: number }) {
  const minDays = params.min_days_overdue || 14;
  const limit = params.limit || 10;

  const { data, error } = await supabase
    .from('v_critical_leads')
    .select('*')
    .gte('days_overdue', minDays)
    .order('days_overdue', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Critical leads query error:', error);
    // Fallback query
    const { data: projects } = await supabase
      .from('solar_projects')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(limit);
    
    return {
      leads: projects || [],
      count: projects?.length || 0,
      filter_applied: { min_days_overdue: minDays }
    };
  }

  return {
    leads: data || [],
    count: data?.length || 0,
    filter_applied: { min_days_overdue: minDays }
  };
}

async function handleGetRecoveryPipeline(params: { stage?: string }) {
  let query = supabase
    .from('v_payment_recovery_pipeline')
    .select('*');

  if (params.stage) {
    query = query.eq('stage', params.stage);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Pipeline query error:', error);
    // Fallback aggregation
    const { data: projects } = await supabase
      .from('solar_projects')
      .select('stage, outstanding_balance');
    
    if (projects) {
      const stages = ['80%', '20%', 'Handover'];
      const pipeline = stages.map(stage => ({
        stage,
        count: projects.filter(p => p.stage === stage).length,
        total_value: projects.filter(p => p.stage === stage)
          .reduce((sum, p) => sum + (p.outstanding_balance || 0), 0)
      }));
      
      return {
        pipeline: params.stage ? pipeline.filter(p => p.stage === params.stage) : pipeline,
        currency: 'MYR'
      };
    }
  }

  return {
    pipeline: data || [],
    currency: 'MYR'
  };
}

async function handleGetRecentActivity(params: { days?: number }) {
  const days = params.days || 7;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from('solar_recovery_actions')
    .select('*')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Activity query error:', error);
  }

  return {
    activities: data || [],
    period_days: days,
    count: data?.length || 0
  };
}

// MCP JSON-RPC Handler
async function handleMcpRequest(request: {
  jsonrpc: string;
  id: string | number;
  method: string;
  params?: any;
}) {
  const { method, params, id } = request;

  try {
    switch (method) {
      case 'initialize':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: { listChanged: false }
            },
            serverInfo: {
              name: 'qontrek-solar-mcp',
              version: '1.0.0'
            }
          }
        };

      case 'tools/list':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            tools: MCP_TOOLS
          }
        };

      case 'tools/call':
        const toolName = params?.name;
        const toolParams = params?.arguments || {};
        
        let result;
        switch (toolName) {
          case 'get_kpi_summary':
            result = await handleGetKpiSummary();
            break;
          case 'get_critical_leads':
            result = await handleGetCriticalLeads(toolParams);
            break;
          case 'get_recovery_pipeline':
            result = await handleGetRecoveryPipeline(toolParams);
            break;
          case 'get_recent_activity':
            result = await handleGetRecentActivity(toolParams);
            break;
          default:
            return {
              jsonrpc: '2.0',
              id,
              error: {
                code: -32601,
                message: `Unknown tool: ${toolName}`
              }
            };
        }

        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ]
          }
        };

      default:
        return {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: `Method not found: ${method}`
          }
        };
    }
  } catch (error: any) {
    console.error('MCP handler error:', error);
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32603,
        message: error.message || 'Internal error'
      }
    };
  }
}

// GET handler - Health check and capability discovery
export async function GET(request: NextRequest) {
  return NextResponse.json({
    name: 'qontrek-solar-mcp',
    version: '1.0.0',
    protocol: 'mcp',
    protocolVersion: '2024-11-05',
    description: 'Qontrek Solar Payment Recovery MCP Server',
    capabilities: {
      tools: true,
      resources: false,
      prompts: false
    },
    tools: MCP_TOOLS.map(t => t.name),
    status: 'healthy'
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

// POST handler - MCP JSON-RPC
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle single request or batch
    if (Array.isArray(body)) {
      const responses = await Promise.all(body.map(handleMcpRequest));
      return NextResponse.json(responses, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const response = await handleMcpRequest(body);
    return NextResponse.json(response, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error: any) {
    console.error('MCP POST error:', error);
    return NextResponse.json({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: -32700,
        message: 'Parse error'
      }
    }, { 
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}

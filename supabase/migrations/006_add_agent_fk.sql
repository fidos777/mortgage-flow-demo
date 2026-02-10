-- 006: Added assigned_agent_id FK to mortgage_agents
ALTER TABLE mortgage_cases ADD CONSTRAINT mortgage_cases_assigned_agent_id_fkey FOREIGN KEY (assigned_agent_id) REFERENCES mortgage_agents(id) ON DELETE SET NULL;

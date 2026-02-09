/**
 * Progressive Disclosure Components - Usage Examples
 * Session 2: Design Amendments v2.1
 *
 * This file demonstrates how to use all progressive disclosure components.
 * Remove this file before production build.
 */

'use client';

import { CollapsibleSection, Accordion, ExpandableCard, ReadMore, StepCards, StepProgress } from './index';
import { Info, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

/**
 * Example 1: Simple Collapsible Section
 */
export function CollapsibleExample() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Collapsible Section Example</h2>

      <CollapsibleSection
        title="What is Progressive Disclosure?"
        icon={<Info className="w-5 h-5" />}
        defaultOpen={true}
      >
        <p className="text-slate-600">
          Progressive disclosure is a design technique that reveals information gradually.
          This reduces cognitive load and helps users focus on the most relevant information first.
        </p>
      </CollapsibleSection>

      <CollapsibleSection
        title="Why is content always in the DOM?"
        defaultOpen={false}
      >
        <p className="text-slate-600">
          Keeping content in the DOM ensures:
        </p>
        <ul className="list-disc list-inside text-slate-600 mt-2 space-y-1">
          <li>Accessibility compliance</li>
          <li>Legal text remains visible</li>
          <li>Screen readers can access content</li>
          <li>No layout shift on toggle</li>
        </ul>
      </CollapsibleSection>
    </div>
  );
}

/**
 * Example 2: Accordion with Multiple Items
 */
export function AccordionExample() {
  const faqs = [
    {
      id: 'faq-1',
      title: 'How do I apply for a mortgage?',
      content: (
        <div className="space-y-3 text-slate-600">
          <p>To apply for a mortgage:</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Fill out the application form</li>
            <li>Submit required documents</li>
            <li>Undergo credit check</li>
            <li>Receive approval decision</li>
          </ol>
        </div>
      ),
    },
    {
      id: 'faq-2',
      title: 'What documents are required?',
      content: (
        <div className="space-y-3 text-slate-600">
          <p>Required documents typically include:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Identity card/Passport</li>
            <li>Proof of income (payslips, tax returns)</li>
            <li>Bank statements (3-6 months)</li>
            <li>Property documents</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'faq-3',
      title: 'What is the processing time?',
      content: (
        <p className="text-slate-600">
          Typically, mortgage applications are processed within 7-14 business days,
          depending on the completeness of your application and document verification.
        </p>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">FAQ Accordion Example</h2>
      <Accordion
        items={faqs}
        allowMultiple={false}
        defaultOpenIndex={0}
        gap="md"
      />
    </div>
  );
}

/**
 * Example 3: Expandable Card
 */
export function ExpandableCardExample() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Expandable Card Example</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <ExpandableCard
          title="Property A"
          preview="3 BR | 2 BA | 1,200 sqft | RM450,000"
          icon={<Info className="w-5 h-5 text-blue-600" />}
          expandLabel="Lihat Butiran"
          collapseLabel="Tutup"
        >
          <div className="space-y-3">
            <p className="text-slate-600">
              Beautiful 3-bedroom corner lot property in a prime location.
            </p>
            <div className="bg-slate-100 rounded p-3">
              <p className="text-sm font-semibold mb-2">Property Features:</p>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>Main suite with ensuite bathroom</li>
                <li>Modern kitchen with gas stove</li>
                <li>Living & dining area</li>
                <li>Covered parking</li>
                <li>Garden</li>
              </ul>
            </div>
          </div>
        </ExpandableCard>

        <ExpandableCard
          title="Property B"
          preview="2 BR | 1 BA | 800 sqft | RM320,000"
          icon={<Info className="w-5 h-5 text-blue-600" />}
          expandLabel="Lihat Butiran"
          collapseLabel="Tutup"
        >
          <div className="space-y-3">
            <p className="text-slate-600">
              Compact and modern 2-bedroom apartment perfect for first-time buyers.
            </p>
            <div className="bg-slate-100 rounded p-3">
              <p className="text-sm font-semibold mb-2">Property Features:</p>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>Master bedroom with balcony</li>
                <li>Open-plan living area</li>
                <li>Modern kitchen</li>
                <li>Shared gym & pool</li>
              </ul>
            </div>
          </div>
        </ExpandableCard>
      </div>
    </div>
  );
}

/**
 * Example 4: Read More Text
 */
export function ReadMoreExample() {
  const longText = `
    The mortgage application process involves several steps to ensure
    that both the lender and borrower are protected. First, you'll need to
    gather all required documentation including proof of income, employment
    verification, and bank statements. Our team will then conduct a comprehensive
    credit check to assess your creditworthiness. Once approved, we'll arrange
    a property valuation and title search. Throughout the process, we maintain
    transparent communication and provide regular updates on your application status.
    The entire process typically takes 7-14 business days, but this can vary based
    on the complexity of your situation and the completeness of your submitted documents.
    We're here to support you every step of the way!
  `;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Read More Example</h2>
      <div className="bg-slate-50 p-6 rounded-lg">
        <p className="font-semibold mb-3">Mortgage Process Overview</p>
        <ReadMore
          text={longText.trim()}
          maxLength={200}
          expandLabel="Baca Lagi"
          collapseLabel="Tutup"
          textClassName="text-slate-700 leading-relaxed"
        />
      </div>
    </div>
  );
}

/**
 * Example 5: Step Cards & Progress
 */
export function StepCardsExample() {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      id: 'step-1',
      title: 'Personal Information',
      description: 'Enter your full name, contact details, and identification',
      completed: currentStep > 0,
      status: currentStep > 0 ? 'Done' : 'Current',
      details: (
        <div className="space-y-3">
          <p className="text-slate-600">
            This step collects your basic information for our records.
          </p>
          <div className="bg-slate-100 rounded p-3 text-sm text-slate-600">
            <p className="font-semibold mb-2">Required Information:</p>
            <ul className="space-y-1">
              <li>Full name (as per ID)</li>
              <li>Date of birth</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Residential address</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'step-2',
      title: 'Employment & Income',
      description: 'Verify your employment status and income details',
      completed: currentStep > 1,
      status: currentStep > 1 ? 'Done' : currentStep === 1 ? 'Current' : 'Pending',
      details: (
        <div className="space-y-3">
          <p className="text-slate-600">
            We'll verify your employment and assess your income for mortgage eligibility.
          </p>
          <div className="bg-slate-100 rounded p-3 text-sm text-slate-600">
            <p className="font-semibold mb-2">Information Needed:</p>
            <ul className="space-y-1">
              <li>Employer name and contact</li>
              <li>Job title and duration</li>
              <li>Annual salary</li>
              <li>Latest payslips (3 months)</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'step-3',
      title: 'Document Submission',
      description: 'Upload all required supporting documents',
      completed: false,
      status: currentStep === 2 ? 'Current' : 'Pending',
      details: (
        <div className="space-y-3">
          <p className="text-slate-600">
            Submit all required documents securely through our platform.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-900">
            <p className="font-semibold mb-2">Documents to Upload:</p>
            <ul className="space-y-1">
              <li>Identity card/Passport</li>
              <li>Bank statements (6 months)</li>
              <li>Proof of income</li>
              <li>Property documents</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'step-4',
      title: 'Review & Approval',
      description: 'Final review and approval decision',
      completed: false,
      status: 'Pending',
      details: (
        <div className="space-y-3">
          <p className="text-slate-600">
            Our team will review all submitted documents and provide an approval decision.
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Step Cards Example</h2>

      {/* Horizontal Progress */}
      <div>
        <p className="text-sm font-semibold text-slate-600 mb-4">Progress</p>
        <StepProgress
          steps={steps}
          currentStep={currentStep}
          onStepClick={(index) => setCurrentStep(index)}
        />
      </div>

      {/* Vertical Step Cards */}
      <StepCards
        steps={steps}
        currentStep={currentStep}
        onStepClick={(index) => setCurrentStep(index)}
        showStepNumbers={true}
        showTimeline={true}
      />
    </div>
  );
}

/**
 * Complete Demo Component
 */
export function ProgressiveDisclosureDemo() {
  const [activeTab, setActiveTab] = useState<'collapsible' | 'accordion' | 'card' | 'readmore' | 'steps'>('collapsible');

  const tabs = [
    { id: 'collapsible', label: 'Collapsible' },
    { id: 'accordion', label: 'Accordion' },
    { id: 'card', label: 'Card' },
    { id: 'readmore', label: 'Read More' },
    { id: 'steps', label: 'Steps' },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Progressive Disclosure Components</h1>
        <p className="text-slate-600">Session 2 Examples - All content stays in DOM</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-8">
        {activeTab === 'collapsible' && <CollapsibleExample />}
        {activeTab === 'accordion' && <AccordionExample />}
        {activeTab === 'card' && <ExpandableCardExample />}
        {activeTab === 'readmore' && <ReadMoreExample />}
        {activeTab === 'steps' && <StepCardsExample />}
      </div>

      {/* Info Box */}
      <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6 flex gap-4">
        <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-blue-900 mb-2">Key Principle</p>
          <p className="text-blue-800 text-sm">
            All content is always in the DOM. We use CSS to control visibility, not conditional rendering.
            This ensures accessibility, legal compliance, and better performance.
          </p>
        </div>
      </div>
    </div>
  );
}

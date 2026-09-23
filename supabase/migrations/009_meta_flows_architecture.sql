-- Migration 009: Meta Flows Architecture Refactor

-- 1. Table for Flow Endpoint Configurations (Data Exchange)
CREATE TABLE IF NOT EXISTS public.flow_endpoint_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    flow_id UUID NOT NULL REFERENCES public.whatsapp_flows(id) ON DELETE CASCADE,
    
    -- Keys for decrypting Meta Data Exchange payloads
    private_key_pem TEXT,
    public_key_pem TEXT,
    
    -- Configuration
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Allow one active config per flow
    CONSTRAINT unique_active_endpoint_per_flow UNIQUE (flow_id)
);

-- 2. Table for Flow Versions (History and Rollback)
CREATE TABLE IF NOT EXISTS public.flow_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    flow_id UUID NOT NULL REFERENCES public.whatsapp_flows(id) ON DELETE CASCADE,
    
    version_number INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('DRAFT', 'PUBLISHED', 'DEPRECATED')),
    
    -- The actual Meta JSON payload (and our internal visual representation state if needed)
    flow_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    CONSTRAINT unique_flow_version UNIQUE (flow_id, version_number)
);

-- 3. Table for Flow Submissions (When a user submits a flow that routes to our endpoint)
CREATE TABLE IF NOT EXISTS public.flow_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    flow_id UUID NOT NULL REFERENCES public.whatsapp_flows(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    
    submission_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    screen_id TEXT, -- The screen from which it was submitted
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Table for Flow Events (Analytics)
CREATE TABLE IF NOT EXISTS public.flow_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    flow_id UUID NOT NULL REFERENCES public.whatsapp_flows(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    
    event_type TEXT NOT NULL, -- e.g., 'OPENED', 'SCREEN_VIEW', 'COMPLETED', 'ERROR'
    event_data JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.flow_endpoint_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_events ENABLE ROW LEVEL SECURITY;

-- Endpoint Configs Policies
CREATE POLICY "Users can view their organization's endpoint configs" 
ON public.flow_endpoint_configs FOR SELECT 
USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their organization's endpoint configs" 
ON public.flow_endpoint_configs FOR ALL 
USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));

-- Flow Versions Policies
CREATE POLICY "Users can view their organization's flow versions" 
ON public.flow_versions FOR SELECT 
USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their organization's flow versions" 
ON public.flow_versions FOR ALL 
USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));

-- Flow Submissions Policies
CREATE POLICY "Users can view their organization's flow submissions" 
ON public.flow_submissions FOR SELECT 
USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their organization's flow submissions" 
ON public.flow_submissions FOR ALL 
USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));

-- Flow Events Policies
CREATE POLICY "Users can view their organization's flow events" 
ON public.flow_events FOR SELECT 
USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their organization's flow events" 
ON public.flow_events FOR ALL 
USING (organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()));

-- Trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_flow_endpoint_configs_updated_at') THEN
        CREATE TRIGGER update_flow_endpoint_configs_updated_at
        BEFORE UPDATE ON public.flow_endpoint_configs
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

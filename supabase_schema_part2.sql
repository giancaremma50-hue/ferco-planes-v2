-- ==========================================
-- SCRIPT COMPLEMENTARIO: PLANES Y NOTIFICACIONES
-- Ejecutar en el SQL Editor
-- ==========================================

CREATE TABLE IF NOT EXISTS public.planes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "liderUid" UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    "colaboradorUid" UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    area TEXT,
    pais TEXT,
    region TEXT,
    zona TEXT,
    sucursal TEXT,
    "fechaCreacion" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "estado" TEXT DEFAULT 'Borrador',
    "nombrePlan" TEXT,
    "fechaObjetivo" DATE,
    "metricaBase" TEXT,
    "metricaMeta" TEXT,
    "logrosMesAnterior" TEXT,
    "retosMesAnterior" TEXT,
    "focoUnico" TEXT,
    "accionesConcretas" TEXT,
    "recursos" TEXT,
    "consecuencias" TEXT,
    "mesPlan" TEXT,
    "yearPlan" INTEGER,
    "evaluacion" JSONB, -- Para guardar la evaluación estructurada
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notificaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    texto TEXT NOT NULL,
    "read" BOOLEAN DEFAULT FALSE,
    "timestamp" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tipo TEXT
);

-- RLS
ALTER TABLE public.planes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acceso a planes" ON public.planes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Permitir acceso a notificaciones" ON public.notificaciones FOR ALL USING (auth.role() = 'authenticated');

-- ==========================================
-- 4. AJUSTE DE COLUMNA DE SUCURSAL EN PERFILES
-- ==========================================
ALTER TABLE IF EXISTS public.perfiles ADD COLUMN IF NOT EXISTS sucursal TEXT;


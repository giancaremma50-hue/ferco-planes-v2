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


-- ==========================================
-- 5. TABLA PARA LA COLA DE CORREOS (mail)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.mail (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "to" TEXT[] NOT NULL,
    message JSONB NOT NULL
);

-- RLS para la tabla mail
ALTER TABLE public.mail ENABLE ROW LEVEL SECURITY;

-- Permitir a usuarios autenticados insertar correos en la cola
CREATE POLICY "Permitir inserción de correos a autenticados" 
ON public.mail FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Permitir a usuarios autenticados leer sus propios registros o consultas de envío
CREATE POLICY "Permitir lectura de correos a autenticados" 
ON public.mail FOR SELECT 
TO authenticated 
USING (true);



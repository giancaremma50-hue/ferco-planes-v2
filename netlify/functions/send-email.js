// netlify/functions/send-email.js
// Netlify Functions v2 — Resend email with optional PDF attachment
// Reads RESEND_API_KEY from Netlify environment variables (never exposed to client)

// ── Helpers ──────────────────────────────────────────────────────────────────

function getCurrSymbol(pais) {
  if (!pais) return '$';
  const p = pais.toLowerCase();
  if (p.includes('guatemala')) return 'Q';
  if (p.includes('honduras'))  return 'L';
  return '$';
}

function fmtMoney(n, sym) {
  return sym + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function escHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const UAU_LABELS = {
  metaUtilidad: 'Meta de Utilidad ($)',
  utilidadGenerada: 'Utilidad Generada ($)',
  montoCotizado: 'Monto Cotizado ($)',
  facturacion: 'Facturación ($)',
  clientesAtendidos: 'Clientes Atendidos',
  cotizaciones: 'Cotizaciones',
  facturas: 'Facturas',
  oport2_5K_mas: 'Oport > $2.5K',
  oport2_5K_menos: 'Oport < $2.5K',
  totalOportSF: 'Total Oport Abiertas en SF',
  oportunidadesPerdidas: 'Oportunidades Perdidas',
};
const MONEY_FIELDS = ['metaUtilidad', 'utilidadGenerada', 'montoCotizado', 'facturacion'];

function buildIndicatorsTable(ind, sym) {
  const rows = Object.keys(UAU_LABELS).map(k => {
    const lbl = UAU_LABELS[k].replace('($)', `(${sym})`);
    const val = MONEY_FIELDS.includes(k) ? fmtMoney(ind[k], sym) : Number(ind[k] || 0).toLocaleString('en-US');
    return `<tr><td style="padding:5px 10px;border-bottom:1px solid #e2e8f0;font-size:12px">${escHtml(lbl)}</td>
            <td style="padding:5px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;text-align:right;font-weight:600">${val}</td></tr>`;
  }).join('');
  const metaU = ind.metaUtilidad || 0;
  const utilG = ind.utilidadGenerada || 0;
  const ppt = metaU > 0 ? (utilG / metaU * 100).toFixed(1) : '—';
  const montoC = ind.montoCotizado || 0;
  const factu = ind.facturacion || 0;
  const mc = montoC > 0 ? (factu / montoC * 100).toFixed(1) : '—';
  const calcRows = `
    <tr><td style="padding:5px 10px;border-bottom:1px solid #e2e8f0;font-size:12px">% PPT</td>
    <td style="padding:5px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;text-align:right;font-weight:700;color:#0f172a">${ppt !== '—' ? ppt + '%' : '—'}</td></tr>
    <tr><td style="padding:5px 10px;border-bottom:1px solid #e2e8f0;font-size:12px">Tasa de Conversión %</td>
    <td style="padding:5px 10px;border-bottom:1px solid #e2e8f0;font-size:12px;text-align:right;font-weight:700;color:#0f172a">${mc !== '—' ? mc + '%' : '—'}</td></tr>`;
  return `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:12px">
    <thead><tr style="background:#f8fafc"><th colspan="2" style="padding:7px 10px;font-size:11px;text-align:left;color:#64748b;font-weight:600">INDICADORES</th></tr></thead>
    <tbody>${rows}${calcRows}</tbody></table>`;
}

function buildComparisonTable(prev, curr, sym) {
  const rows = [...Object.keys(UAU_LABELS), 'ppt', 'mc'].map(k => {
    let lbl, pV, cV, diffStr, isPos;
    if (k === 'ppt') {
      lbl = '% PPT';
      const pm = prev.metaUtilidad || 0; pV = pm > 0 ? (prev.utilidadGenerada || 0) / pm * 100 : 0;
      const cm = curr.metaUtilidad || 0; cV = cm > 0 ? (curr.utilidadGenerada || 0) / cm * 100 : 0;
      const d = cV - pV; isPos = d >= 0;
      diffStr = (d >= 0 ? '▲ +' : '▼ ') + Math.abs(d).toFixed(1) + ' pts';
      return `<tr><td style="padding:4px 8px;font-size:11px;border-bottom:1px solid #e2e8f0">${lbl}</td>
        <td style="padding:4px 8px;font-size:11px;text-align:right;border-bottom:1px solid #e2e8f0">${pV.toFixed(1)}%</td>
        <td style="padding:4px 8px;font-size:11px;text-align:right;border-bottom:1px solid #e2e8f0">${cV.toFixed(1)}%</td>
        <td style="padding:4px 8px;font-size:11px;text-align:right;border-bottom:1px solid #e2e8f0;font-weight:700;color:${isPos ? '#166534' : '#991b1b'}">${diffStr}</td></tr>`;
    } else if (k === 'mc') {
      lbl = 'Tasa de Conversión %';
      const pc = prev.montoCotizado || 0; pV = pc > 0 ? (prev.facturacion || 0) / pc * 100 : 0;
      const cc = curr.montoCotizado || 0; cV = cc > 0 ? (curr.facturacion || 0) / cc * 100 : 0;
      const d = cV - pV; isPos = d >= 0;
      diffStr = (d >= 0 ? '▲ +' : '▼ ') + Math.abs(d).toFixed(1) + ' pts';
      return `<tr><td style="padding:4px 8px;font-size:11px;border-bottom:1px solid #e2e8f0">${lbl}</td>
        <td style="padding:4px 8px;font-size:11px;text-align:right;border-bottom:1px solid #e2e8f0">${pV.toFixed(1)}%</td>
        <td style="padding:4px 8px;font-size:11px;text-align:right;border-bottom:1px solid #e2e8f0">${cV.toFixed(1)}%</td>
        <td style="padding:4px 8px;font-size:11px;text-align:right;border-bottom:1px solid #e2e8f0;font-weight:700;color:${isPos ? '#166534' : '#991b1b'}">${diffStr}</td></tr>`;
    } else {
      lbl = (UAU_LABELS[k] || k).replace('($)', `(${sym})`);
      pV = prev[k] || 0; cV = curr[k] || 0;
      const d = cV - pV; isPos = d >= 0;
      const isMon = MONEY_FIELDS.includes(k);
      const fv = v => isMon ? fmtMoney(v, sym) : Number(v || 0).toLocaleString('en-US');
      const fd = v => isMon ? sym + Math.abs(v).toLocaleString('en-US') : Math.abs(v).toLocaleString('en-US');
      diffStr = (d >= 0 ? '▲ +' : '▼ ') + fd(d);
      return `<tr><td style="padding:4px 8px;font-size:11px;border-bottom:1px solid #e2e8f0">${escHtml(lbl)}</td>
        <td style="padding:4px 8px;font-size:11px;text-align:right;border-bottom:1px solid #e2e8f0">${fv(pV)}</td>
        <td style="padding:4px 8px;font-size:11px;text-align:right;border-bottom:1px solid #e2e8f0">${fv(cV)}</td>
        <td style="padding:4px 8px;font-size:11px;text-align:right;border-bottom:1px solid #e2e8f0;font-weight:700;color:${isPos ? '#166534' : '#991b1b'}">${diffStr}</td></tr>`;
    }
  }).join('');
  return `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:12px">
    <thead><tr style="background:#f8fafc">
      <th style="padding:6px 8px;font-size:11px;text-align:left;color:#64748b">Indicador</th>
      <th style="padding:6px 8px;font-size:11px;text-align:right;color:#64748b">S${prev.semana} ${prev.año} (anterior)</th>
      <th style="padding:6px 8px;font-size:11px;text-align:right;color:#64748b">S${curr.semana} ${curr.año} (actual)</th>
      <th style="padding:6px 8px;font-size:11px;text-align:right;color:#64748b">Diferencia</th>
    </tr></thead>
    <tbody>${rows}</tbody></table>`;
}

function buildHistoryTable(planData, sym) {
  const entries = [{ semana: planData.semana, año: planData.año, ...(planData.indicadores || {}) }];
  for (const seg of planData.seguimientos || []) {
    entries.push({ semana: seg.semana, año: seg.año, ...(seg.indicadores || {}) });
  }
  entries.sort((a, b) => a.año !== b.año ? a.año - b.año : a.semana - b.semana);
  if (entries.length < 2) return '';
  const headers = [...Object.keys(UAU_LABELS), 'ppt', 'mc'];
  const headerRow = headers.map(k => {
    const lbl = k === 'ppt' ? '% PPT' : k === 'mc' ? 'Conv%' : (UAU_LABELS[k] || k).replace('($)', '').trim();
    return `<th style="padding:4px 6px;font-size:10px;white-space:nowrap;background:#f8fafc;color:#64748b">${escHtml(lbl)}</th>`;
  }).join('');
  const dataRows = entries.map(e => {
    const metaU = e.metaUtilidad || 0;
    const utilG = e.utilidadGenerada || 0;
    const ppt = metaU > 0 ? (utilG / metaU * 100).toFixed(1) + '%' : '—';
    const montoC = e.montoCotizado || 0;
    const factu = e.facturacion || 0;
    const mc = montoC > 0 ? (factu / montoC * 100).toFixed(1) + '%' : '—';
    const cells = [...Object.keys(UAU_LABELS), 'ppt', 'mc'].map(k => {
      let v;
      if (k === 'ppt') v = ppt;
      else if (k === 'mc') v = mc;
      else v = MONEY_FIELDS.includes(k) ? fmtMoney(e[k], sym) : Number(e[k] || 0).toLocaleString('en-US');
      return `<td style="padding:4px 6px;font-size:10px;text-align:right;border-bottom:1px solid #f1f5f9">${v}</td>`;
    }).join('');
    return `<tr><td style="padding:4px 6px;font-size:10px;white-space:nowrap;border-bottom:1px solid #f1f5f9;font-weight:600">S${e.semana} ${e.año}</td>${cells}</tr>`;
  }).join('');
  return `<p style="font-size:11px;font-weight:700;color:#0f172a;margin:12px 0 6px">Histórico completo</p>
  <div style="overflow-x:auto"><table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;min-width:600px">
    <thead><tr><th style="padding:4px 6px;font-size:10px;background:#f8fafc;color:#64748b">Semana</th>${headerRow}</tr></thead>
    <tbody>${dataRows}</tbody></table></div>`;
}

function buildSmartList(smart) {
  if (!smart || !smart.length) return '<p style="font-size:12px;color:#64748b">Sin acuerdos SMART.</p>';
  return smart.map((s, i) => `
    <div style="background:#f8fafc;border-radius:8px;padding:10px 12px;margin-bottom:8px">
      <p style="font-size:11px;font-weight:700;color:#0f172a;margin:0 0 6px">${i + 1}. ${escHtml(s.obj || '')}</p>
      <p style="font-size:11px;color:#475569;margin:0 0 3px"><strong>Acción:</strong> ${escHtml(s.accion || '')}</p>
      <p style="font-size:11px;color:#475569;margin:0 0 3px"><strong>Fecha seguimiento:</strong> ${escHtml(s.fseg || '')} &nbsp;|&nbsp; <strong>Cierre:</strong> ${escHtml(s.fcierre || '')}</p>
      <p style="font-size:11px;color:#475569;margin:0"><strong>Evidencia:</strong> ${escHtml(s.evidencia || '')} &nbsp;|&nbsp; <strong>Soporte:</strong> ${escHtml(s.soporte || '')}</p>
    </div>`).join('');
}

function buildSubject(planData, trigger) {
  const tipo = planData.tipo === 'unoauno' ? 'Uno a Uno' : 'Plan de Fortalecimiento';
  const action = trigger === 'creacion' ? 'creado' : 'seguimiento registrado';
  return `[FERCO] ${tipo} de ${planData.asesor || 'colaborador'} — ${action} · S${planData.semana} ${planData.año}`;
}

function buildEmailHtml(planData, trigger) {
  const sym = getCurrSymbol(planData.pais);
  const isUau = planData.tipo === 'unoauno';
  const isCreacion = trigger === 'creacion';
  const tipoBadge = isUau ? 'Uno a Uno' : 'Plan de Fortalecimiento';
  const triggerLabel = isCreacion ? 'Plan creado' : 'Seguimiento registrado';
  const badgeBg = isUau ? '#f59e0b' : '#1e293b';

  // Build content section
  let contentHtml = '';
  if (isUau) {
    if (isCreacion) {
      contentHtml = `
        <p style="font-size:13px;font-weight:700;color:#0f172a;margin:0 0 8px">Indicadores de la semana inicial</p>
        ${buildIndicatorsTable(planData.indicadores || {}, sym)}`;
    } else {
      const segs = planData.seguimientos || [];
      const allEntries = [
        { semana: planData.semana, año: planData.año, ...(planData.indicadores || {}) },
        ...segs.map(s => ({ semana: s.semana, año: s.año, ...(s.indicadores || {}) }))
      ].sort((a, b) => a.año !== b.año ? a.año - b.año : a.semana - b.semana);
      const last = allEntries[allEntries.length - 1];
      const prev = allEntries[allEntries.length - 2];
      if (prev && last) {
        contentHtml = `
          <p style="font-size:13px;font-weight:700;color:#0f172a;margin:0 0 8px">Comparativa semana anterior vs actual</p>
          ${buildComparisonTable(prev, last, sym)}
          ${buildHistoryTable(planData, sym)}`;
      } else {
        contentHtml = buildIndicatorsTable(planData.indicadores || {}, sym);
      }
    }
    // Resumen y compromisos
    if (planData.resumen) {
      contentHtml += `<p style="font-size:12px;font-weight:700;color:#0f172a;margin:12px 0 4px">Resumen / Causas</p>
        <div style="background:#f8fafc;border-radius:8px;padding:10px 12px;font-size:12px;color:#334155;margin-bottom:8px">${escHtml(planData.resumen)}</div>`;
    }
    if (planData.compromisosAsesor) {
      contentHtml += `<p style="font-size:12px;font-weight:700;color:#0f172a;margin:8px 0 4px">Compromisos del Asesor</p>
        <div style="background:#f8fafc;border-radius:8px;padding:10px 12px;font-size:12px;color:#334155;margin-bottom:8px">${escHtml(planData.compromisosAsesor)}</div>`;
    }
    if (planData.compromisosGerente) {
      contentHtml += `<p style="font-size:12px;font-weight:700;color:#0f172a;margin:8px 0 4px">Compromisos / Despeje de Caminos del Gerente</p>
        <div style="background:#f8fafc;border-radius:8px;padding:10px 12px;font-size:12px;color:#334155;margin-bottom:8px">${escHtml(planData.compromisosGerente)}</div>`;
    }
  } else {
    // Fortalecimiento
    if (isCreacion) {
      if (planData.fortalezas) {
        contentHtml += `<p style="font-size:12px;font-weight:700;color:#0f172a;margin:0 0 4px">Fortalezas identificadas</p>
          <div style="background:#f8fafc;border-radius:8px;padding:10px 12px;font-size:12px;color:#334155;margin-bottom:8px">${escHtml(planData.fortalezas)}</div>`;
      }
      if (planData.areas) {
        contentHtml += `<p style="font-size:12px;font-weight:700;color:#0f172a;margin:8px 0 4px">Áreas de mejora</p>
          <div style="background:#f8fafc;border-radius:8px;padding:10px 12px;font-size:12px;color:#334155;margin-bottom:8px">${escHtml(planData.areas)}</div>`;
      }
      if (planData.smart && planData.smart.length) {
        contentHtml += `<p style="font-size:12px;font-weight:700;color:#0f172a;margin:8px 0 4px">Acuerdos SMART</p>
          ${buildSmartList(planData.smart)}`;
      }
    } else {
      // Seguimiento Fortalecimiento — último seguimiento
      const segs = planData.seguimientos || [];
      const lastSeg = segs[segs.length - 1];
      if (lastSeg) {
        contentHtml += `<p style="font-size:12px;font-weight:700;color:#0f172a;margin:0 0 4px">Último seguimiento — ${escHtml(lastSeg.fecha || '')}</p>`;
        if (lastSeg.avance) contentHtml += `<div style="background:#f8fafc;border-radius:8px;padding:10px 12px;font-size:12px;color:#334155;margin-bottom:8px">${escHtml(lastSeg.avance)}</div>`;
        if (lastSeg.acuerdo) {
          contentHtml += `<p style="font-size:11px;font-weight:700;color:#0f172a;margin:8px 0 3px">Acuerdo evaluado</p>
            <div style="background:#f8fafc;border-radius:8px;padding:8px 12px;font-size:12px;color:#334155;margin-bottom:8px">${escHtml(lastSeg.acuerdo)}</div>`;
        }
      }
    }
  }

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;max-width:600px;width:100%">
        <!-- HEADER -->
        <tr><td style="background:#0f172a;padding:20px 24px">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td><span style="font-size:20px;font-weight:900;color:#fff;letter-spacing:1px">FERCO <span style="color:#F0BE1A">PLANES</span></span></td>
              <td align="right">
                <span style="background:${badgeBg};color:${isUau ? '#1e293b' : '#fff'};padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700">${tipoBadge}</span>
                &nbsp;
                <span style="background:#1e40af;color:#fff;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700">${triggerLabel}</span>
              </td>
            </tr>
          </table>
        </td></tr>
        <!-- DATOS -->
        <tr><td style="padding:16px 24px 0">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
            <tr><td style="padding:5px 0;font-size:12px;color:#64748b;width:130px">Colaborador</td><td style="padding:5px 0;font-size:12px;font-weight:700;color:#0f172a">${escHtml(planData.asesor || '')}</td></tr>
            <tr><td style="padding:5px 0;font-size:12px;color:#64748b">Líder</td><td style="padding:5px 0;font-size:12px;color:#334155">${escHtml(planData.lider || '')}</td></tr>
            <tr><td style="padding:5px 0;font-size:12px;color:#64748b">Semana</td><td style="padding:5px 0;font-size:12px;color:#334155">S${planData.semana} ${planData.año}</td></tr>
            <tr><td style="padding:5px 0;font-size:12px;color:#64748b">País / Sucursal</td><td style="padding:5px 0;font-size:12px;color:#334155">${escHtml(planData.pais || '')}${planData.sucursal ? ' — ' + escHtml(planData.sucursal) : ''}</td></tr>
            <tr><td style="padding:5px 0;font-size:12px;color:#64748b">Estado</td><td style="padding:5px 0;font-size:12px;color:#334155">${escHtml(planData.estado || '')}</td></tr>
          </table>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:14px 0">
        </td></tr>
        <!-- CONTENT -->
        <tr><td style="padding:0 24px 8px">${contentHtml}</td></tr>
        <!-- FOOTER -->
        <tr><td style="background:#f8fafc;padding:14px 24px;border-top:1px solid #e2e8f0">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:11px;color:#94a3b8">Este correo fue generado automáticamente por FERCO Planes. Se adjunta el PDF completo del plan.</td>
              <td align="right"><a href="https://ferco-planes-v2.netlify.app" style="font-size:11px;color:#1e40af;text-decoration:none">Abrir en la plataforma →</a></td>
            </tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), { status: 500 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const { planData, trigger, pdfBase64 } = body;

  if (!planData?.correoAsesor) {
    return new Response(JSON.stringify({ skipped: true, reason: 'no correoAsesor' }), { status: 200 });
  }

  const html = buildEmailHtml(planData, trigger);
  const subject = buildSubject(planData, trigger);
  const asesorSlug = (planData.asesor || 'plan').replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
  const filename = `Plan-${asesorSlug}-S${planData.semana}-${planData.año}.pdf`;

  const emailPayload = {
    from: 'FERCO Planes <onboarding@resend.dev>',  // cambiar a dominio verificado en prod
    to: [planData.correoAsesor],
    cc: planData.correoLider ? [planData.correoLider] : [],
    subject,
    html,
    ...(pdfBase64 ? { attachments: [{ filename, content: pdfBase64 }] } : {})
  };

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });
    const data = await res.json();
    return new Response(JSON.stringify(data), { status: res.status });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

export const config = { path: '/api/send-email' };

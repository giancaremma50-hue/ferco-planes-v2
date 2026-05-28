exports.handler = async (event, context) => {
  // Solo permitir solicitudes POST
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: 'Method Not Allowed' 
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    
    let to, subject, html;

    // Caso A: Webhook de Supabase (el payload del insert viene dentro de "record")
    if (body.record) {
      to = body.record.to;
      subject = body.record.message?.subject;
      html = body.record.message?.html;
    } 
    // Caso B: Llamada HTTP directa desde el frontend
    else {
      to = body.to;
      subject = body.subject;
      html = body.html;
    }

    if (!to || !subject || !html) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Faltan campos requeridos (to, subject, html)' })
      };
    }

    // Convertir 'to' a Array si viene como string
    const toArray = Array.isArray(to) ? to : [to];

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('Error: La variable de entorno RESEND_API_KEY no está configurada en Netlify.');
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'La API Key de Resend no está configurada en el servidor.' })
      };
    }

    // Usar remitente por defecto o personalizado de variables de entorno
    // Resend requiere que sea 'onboarding@resend.dev' para cuentas gratuitas sin dominio verificado
    const fromEmail = process.env.FROM_EMAIL || 'Planes Ferco <onboarding@resend.dev>';

    console.log(`[SendEmail] Intentando enviar a: ${toArray.join(', ')} | Asunto: "${subject}"`);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: fromEmail,
        to: toArray,
        subject: subject,
        html: html
      })
    });

    const resData = await response.json();

    if (!response.ok) {
      console.error('[SendEmail] Error al despachar en Resend:', resData);
      return {
        statusCode: response.status,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Error del proveedor de correos', details: resData })
      };
    }

    console.log('[SendEmail] Correo enviado exitosamente:', resData);
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ message: 'Correo despachado con éxito', data: resData })
    };

  } catch (error) {
    console.error('[SendEmail] Excepción en la ejecución:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message })
    };
  }
};

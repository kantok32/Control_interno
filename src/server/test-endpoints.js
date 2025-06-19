import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3001/api';

async function testEndpoint(method, endpoint, data = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const result = await response.json();

    console.log(`✅ ${method} ${endpoint} - Status: ${response.status}`);
    return result;
  } catch (error) {
    console.log(`❌ ${method} ${endpoint} - Error: ${error.message}`);
    return null;
  }
}

async function runTests() {
  console.log('🧪 Iniciando pruebas de endpoints...\n');

  // 1. Probar endpoint de salud
  console.log('1. Probando endpoint de salud...');
  await testEndpoint('GET', '/health');

  // 2. Obtener estadísticas generales
  console.log('\n2. Obteniendo estadísticas generales...');
  const stats = await testEndpoint('GET', '/estadisticas');
  if (stats) {
    console.log('📊 Estadísticas:');
    console.log(`   - Total casos: ${stats.casos?.total_casos || 0}`);
    console.log(`   - Total documentos: ${stats.documentos?.total_documentos || 0}`);
    console.log(`   - Documentos recientes: ${stats.documentos_recientes?.length || 0}`);
  }

  // 3. Obtener casos con estadísticas
  console.log('\n3. Obteniendo casos con estadísticas...');
  const casos = await testEndpoint('GET', '/casos');
  if (casos && casos.length > 0) {
    console.log(`📋 Casos encontrados: ${casos.length}`);
    casos.forEach(caso => {
      console.log(`   - ${caso.id}: ${caso.cliente} (${caso.total_documentos || 0} documentos)`);
    });
  }

  // 4. Obtener caso específico con documentos
  if (casos && casos.length > 0) {
    console.log('\n4. Obteniendo caso específico con documentos...');
    const casoDetalle = await testEndpoint('GET', `/casos/${casos[0].id}`);
    if (casoDetalle) {
      console.log(`📄 Caso ${casoDetalle.caso.id}:`);
      console.log(`   - Cliente: ${casoDetalle.caso.cliente}`);
      console.log(`   - Documentos: ${casoDetalle.documentos.length}`);
      console.log(`   - Estadísticas: ${JSON.stringify(casoDetalle.estadisticas)}`);
    }
  }

  // 5. Crear un nuevo documento
  console.log('\n5. Creando nuevo documento...');
  const nuevoDocumento = await testEndpoint('POST', '/documentos', {
    caso_id: casos?.[0]?.id || 'CAS-001',
    nombre: 'Documento de Prueba',
    tipo: 'NOTA',
    descripcion: 'Documento creado para pruebas del sistema',
    contenido_texto: 'Este es un documento de prueba creado automáticamente para verificar el funcionamiento del sistema de documentos.',
    creado_por: 'Sistema de Pruebas'
  });

  if (nuevoDocumento) {
    console.log(`📝 Documento creado con ID: ${nuevoDocumento.id}`);

    // 6. Obtener el documento creado
    console.log('\n6. Obteniendo documento específico...');
    const documento = await testEndpoint('GET', `/documentos/${nuevoDocumento.id}`);
    if (documento) {
      console.log(`📄 Documento ${documento.id}: ${documento.nombre}`);
      console.log(`   - Tipo: ${documento.tipo}`);
      console.log(`   - Caso: ${documento.caso_id}`);
    }

    // 7. Actualizar el documento
    console.log('\n7. Actualizando documento...');
    const documentoActualizado = await testEndpoint('PUT', `/documentos/${nuevoDocumento.id}`, {
      nombre: 'Documento de Prueba - Actualizado',
      tipo: 'NOTA',
      descripcion: 'Documento actualizado para pruebas del sistema',
      contenido_texto: 'Este documento ha sido actualizado para verificar el funcionamiento del sistema de actualización.'
    });

    if (documentoActualizado) {
      console.log(`📝 Documento actualizado: ${documentoActualizado.documento.nombre}`);
    }

    // 8. Buscar documentos
    console.log('\n8. Probando búsqueda de documentos...');
    const busqueda = await testEndpoint('GET', '/documentos/buscar?q=prueba');
    if (busqueda) {
      console.log(`🔍 Resultados de búsqueda: ${busqueda.length} documentos encontrados`);
    }

    // 9. Obtener documentos de un caso específico
    console.log('\n9. Obteniendo documentos de un caso...');
    const documentosCaso = await testEndpoint('GET', `/casos/${casos?.[0]?.id || 'CAS-001'}/documentos`);
    if (documentosCaso) {
      console.log(`📚 Documentos del caso: ${documentosCaso.length}`);
      documentosCaso.forEach(doc => {
        console.log(`   - ${doc.nombre} (${doc.tipo})`);
      });
    }

    // 10. Eliminar el documento de prueba
    console.log('\n10. Eliminando documento de prueba...');
    await testEndpoint('DELETE', `/documentos/${nuevoDocumento.id}`);
  }

  console.log('\n🎉 Pruebas completadas!');
}

// Ejecutar las pruebas
runTests().catch(console.error); 
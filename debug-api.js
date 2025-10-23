// Script para debuggear las APIs
// Ejecutar en la consola del navegador para probar endpoints

console.log('🔧 Debugging API endpoints...');

const API_BASE_URL = 'http://localhost:4000';

// Obtener token del localStorage
const token = localStorage.getItem('conmomet_token');
console.log('🔑 Token encontrado:', !!token);

if (!token) {
  console.error('❌ No hay token de autenticación. Necesitas hacer login primero.');
} else {
  console.log('🔑 Token:', token.substring(0, 20) + '...');
}

// Headers de autenticación
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
};

// Función helper para hacer requests
async function testEndpoint(endpoint, name) {
  console.log(`\n🔍 Probando ${name}: ${API_BASE_URL}${endpoint}`);
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: headers
    });
    
    console.log(`📡 ${name} response:`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${name} data:`, data);
    } else {
      const errorText = await response.text();
      console.error(`❌ ${name} error:`, errorText);
    }
  } catch (error) {
    console.error(`💥 ${name} error:`, error);
  }
}

// Probar todos los endpoints
async function testAllEndpoints() {
  await testEndpoint('/users', 'Users');
  await testEndpoint('/roles', 'Roles');
  await testEndpoint('/permissions', 'Permissions');
  
  // Probar endpoints alternativos comunes
  await testEndpoint('/api/users', 'Users (API prefix)');
  await testEndpoint('/api/roles', 'Roles (API prefix)');
  await testEndpoint('/api/permissions', 'Permissions (API prefix)');
}

// Ejecutar las pruebas
testAllEndpoints();
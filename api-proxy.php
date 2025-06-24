<?php
// Proxy para conectar el frontend con el backend
header('Access-Control-Allow-Origin: https://controlinterno-83e0a.web.app');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// URL del backend Node.js (ajusta según tu configuración)
$backend_url = 'http://localhost:3000'; // Puerto que use tu app Node.js

// Obtener la ruta de la petición
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);

// Remover /api/ del path si existe
$path = str_replace('/api/', '/', $path);

// URL completa del backend
$full_url = $backend_url . $path;

// Preparar la petición
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $full_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

// Configurar método HTTP
$method = $_SERVER['REQUEST_METHOD'];
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

// Configurar headers
$headers = [];
foreach (getallheaders() as $name => $value) {
    if (strtolower($name) !== 'host') {
        $headers[] = "$name: $value";
    }
}
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

// Configurar body para POST/PUT
if (in_array($method, ['POST', 'PUT', 'PATCH'])) {
    $input = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $input);
}

// Ejecutar la petición
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

// Manejar errores
if ($error) {
    http_response_code(500);
    echo json_encode(['error' => 'Error de conexión con el backend: ' . $error]);
    exit();
}

// Devolver respuesta
http_response_code($http_code);
echo $response;
?> 
<?php
/***** SIMPLE EXAMPLE SAVE IMAGES *****/


error_reporting(E_ALL);
ini_set('display_errors', 'On');

if (empty($_POST['file'])) { 
    exit;
}

$data = $_POST['file'];

$base = $data['tmp'];
$name = $data['name'];
$size = $data['size'];
$type = $data['type'];

switch ($type) {
    case 'image/jpeg':
        $ext = '.jpg';
    break;
    case 'image/png':
        $ext = '.png';
    break;
    case 'image/gif':
        $ext = '.gif';
}

$file = dirname(__FILE__) . '/' . $name;

$image = str_replace(" ", "+", $base);
$image = substr($image, strpos($image, ","));

if (file_put_contents($file, base64_decode($image))) {
    echo $file;
}
?>
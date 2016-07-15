<?php

// Uncomment if you want to allow posts from other domains
// header('Access-Control-Allow-Origin: *');

require_once('slim.php');

// get posted data, if something is wrong, exit
try {
    $images = Slim::getImages();
}
catch (Exception $e) {

    // echo error
    Slim::outputJSON(array(
        'status' => 'failure',
        'message' => 'Unknown'
    ));

    return;
}

// should always be one file (when posting async)
$image = array_shift($images);

// if no images found
if (!isset($image)) {

    // echo error
    Slim::outputJSON(array(
        'status' => 'failure',
        'message' => 'No images found'
    ));

    return;
}

// if no image data found at index 0
if (!isset($image['output']['data'])) {

    // echo error
    Slim::outputJSON(array(
        'status' => 'failure',
        'message' => 'No image data'
    ));

    return;
}

// save the file
$file = Slim::saveFile($image['output']['data'], $image['input']['name']);

// echo results as JSON
Slim::outputJSON(array(
    'status' => 'success',
    'file' => $file['name'],
    'path' => $file['path']
));
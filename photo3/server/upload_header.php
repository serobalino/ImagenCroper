<?php

require __DIR__.'/ImgPicker.php';

$options = array(
    // Upload directory path
    'upload_dir' => __DIR__.'/../files/',

    // Upload directory url:
    'upload_url' => 'files/',

    // Image versions:
    'versions' => array(
        'header' => array(
            'max_width'  => 800,
            'max_height' => 200
        ),
    ),

    /**
     * Load callback.
     *
     * @return string|array
     */
    'load' => function($instance) {
        // return 'avatar.jpg';
    },

    /**
     * Delete callback
     *
     * @param  string $filename
     * @return boolean
     */
    'delete' => function ($filename) {
        return true;
    },

    /**
     * Upload start callback.
     *
     * @param  stdClass $image
     * @return void
     */
    'upload_start' => function ($image) {
        $image->name = '~header.' . $image->type;
    },

    /**
     * Upload complete callback.
     *
     * @param  stdClass $image
     * @return void
     */
    'upload_complete' => function ($image) {
    },

    /**
     * Crop start callback.
     *
     * @param  stdClass $image
     * @return void
     */
    'crop_start' => function ($image) {
        $image->name = 'header.' . $image->type;
    },

    /**
     * Crop complete callback.
     *
     * @param  stdClass $image
     * @return void
     */
    'crop_complete' => function ($image) {

    }
);

// Create new ImgPicker instance.
new ImgPicker($options);

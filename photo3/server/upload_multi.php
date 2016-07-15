<?php

// require  __DIR__.'/DB/Database.php';
// Database::connect(require __DIR__.'/DB/config.php');

require __DIR__.'/ImgPicker.php';

$options = array(
    // Upload directory path
    'upload_dir' => __DIR__.'/../files/',

    // Upload directory url:
    'upload_url' => 'files/',

    /**
     * Load callback.
     *
     * @return string|array
     */
    'load' => function () {
        $db = new Database;

        $results = $db->table('example_images')->get();

        $images = array();

        foreach ($results as $result) {
            $images[] = $result->image;
        }

        return $images;
    },

    /**
     * Delete callback.
     *
     * @param  string $filename
     * @return boolean
     */
    'delete' => function ($filename) {
        // return true;
    },

    /**
     * Upload start callback
     *
     * @param  stdClass $image
     * @return void
     */
    'upload_start' => function ($image) {
        // $image->name = '~4513.' . $image->type;
    },

    /**
     * Upload complete callback
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
        // $image->name = '4513.' . $image->type;
    },

    /**
     * Crop complete callback.
     *
     * @param  stdClass $image
     * @return void
     */
    'crop_complete' => function ($image) {
        $data = array(
            'user_id' => 1,
            'image' => $image->name
        );

        //$db = new Database;
        //$db->table('example_images')->insert($data);
    }
);

// Create new ImgPicker instance.
new ImgPicker($options);

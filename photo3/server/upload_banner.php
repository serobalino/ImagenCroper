<?php

require __DIR__.'/ImgPicker.php';

// require  __DIR__.'/DB/Database.php';
// Database::connect(require __DIR__.'/DB/config.php');

$options = array(
  // Upload directory path
  'upload_dir' => __DIR__.'/../files/',

  // Upload directory url:
  'upload_url' => 'files/',

    // Image versions:
    'versions' => array(
        'banner' => array(
            'max_width'  => 1170,
            'max_height' => 184
        ),
    ),

    /**
     * Load callback.
     *
     * @return string|array
     */
    'load' => function () {
        global $banner_id;

        $db = new Database;
        $results = $db->table('banner')
                      ->where('id', $banner_id)
                      ->limit(1)
                      ->get();
        if ($results)
            return $results[0]->image;
        else
            return false;
    },

    'delete' => function ($filename) {
        return true;
    },

    'upload_start' => function ($image) {
        $banner_id = $_POST['data']['banner_id'];

        // Name the temp image as $banner_id
        $image->name = '~'.$banner_id.'.'.$image->type;
    },

  'upload_complete' => function ($image) {
  },

  /**
   * Crop start callback.
   *
   * @param  stdClass $image
   * @return void
   */
  'crop_start' => function ($image) {
      $banner_id = $_POST['data']['banner_id'];

      // Change the name of the image
      $image->name = $banner_id.'.'.$image->type;
  },

  /**
   * Crop complete callback.
   *
   * @param  stdClass $image
   * @return void
   */
  'crop_complete' => function ($image) {
      $banner_id = $_POST['data']['banner_id']; // Save the image to database
        // $data = array(
        //  'id' => $banner_id,
        //  'imagem' => $image->name
        // );

        // $db = new Database;
        // // First check if the image exists
        // $results = $db->table('banner')
        //               ->where('id', $banner_id)
        //               ->limit(1)
        //               ->get();

        // // If exists update, otherwise insert
        // if ($results)
        //     $db->table('banner')
        //        ->where('id', $banner_id)
        //        ->limit(1)
        //        ->update($data);
        // else
        //     $db->table('banner')->insert($data);
  }
);

// Create new ImgPicker instance.
new ImgPicker($options);

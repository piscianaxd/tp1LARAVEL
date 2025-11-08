<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('songs_saved_db', function (Blueprint $table) {
            $table->id(); // saved_song_id autoincrement
            $table->string('url_song');
            $table->string('name_song');
            $table->string('genre_song');
            $table->string('artist_song');
            $table->string('album_song'); //Aqui deberemos guardar las canciones relacionadas a una playlist
            $table->string('art_work_song');// y crear una tabla nueva exlusiva para guardar canciones
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('songs_saved_db');
    }
};

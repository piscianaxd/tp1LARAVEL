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
        Schema::create('saved_songs', function (Blueprint $table) {
            $table->id(); 
            $table->unsignedBigInteger('songs_saved_db_id');
            $table->unsignedBigInteger('playlist_id');
            $table->timestamps();
            $table->foreign('songs_saved_db_id')->references('id')->on('songs_saved_db')->onDelete('cascade');
            $table->foreign('playlist_id')->references('id')->on('playlists')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('saved_songs');
    }
};

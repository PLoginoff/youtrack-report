module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    express: {
      dev: {
        options: {
          script: "./bin/www"
        }
      }
    },
    watch: {
        express: {
              files:  [ '**/*.js' ],
              tasks:  [ 'express:dev' ],
              options: {
                      spawn: false // for grunt-contrib-watch v0.5.0+, "nospawn: true" for lower versions. Without this option specified express won't be reloaded
                    }
            }
    }
  });

  grunt.loadNpmTasks('grunt-express-server');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', [ 'express:dev', 'watch' ]);

};

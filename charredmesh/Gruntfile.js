module.exports = function(grunt) {
  grunt.initConfig({
    watch: {
      files: ['js/**/*.js'],
      tasks: ['default']
    },

    pkg: grunt.file.readJSON('package.json'),
    transpile: {
      client: {
        type: "amd",
        files: [{
          expand: true,
          cwd: 'js/',
          src: ['**/*.js'],
          dest: 'dist/client/'
        }]
      },

      server: {
        type: "cjs", // or "amd" or "yui"
        files: [{
          expand: true,
          cwd: 'js/',
          src: ['**/*.js'],
          dest: 'dist/server/'
        }]
      }
    },

    requirejs: {
      dev: {
        options: {
          baseUrl: "dist/client",
          name: "client",
          optimize: 'none',
          out: "public/js/client.js",

          shim: {
            'three': {
              exports: 'window'
            }
          },

          paths: {
            three: '../../node_modules/three/three'
          }
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-es6-module-transpiler');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['transpile:client', 'requirejs:dev', 'transpile:server']);
};
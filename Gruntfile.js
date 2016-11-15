module.exports = function (grunt) {

    require('load-grunt-tasks')(grunt);

    grunt.initConfig({

        clean: ['dist'],

        copy: {
            srcAssets: {
                cwd: 'src',
                expand: true,
                src: ['**/*', '!**/*.js'],
                dest: 'dist'
            },
            pluginAssets: {
                cwd: '.',
                expand: true,
                src: ['plugin.json', 'README.md', 'img/**/*'],
                dest: 'dist'
            }
        },

        babel: {
            options: {
                sourceMap: true,
                presets: ['es2015'],
                plugins: ['transform-es2015-modules-systemjs', 'transform-es2015-for-of']
            },
            dist: {
                files: [{
                    cwd: 'src',
                    expand: true,
                    src: ['**/*.js'],
                    dest: 'dist',
                    ext: '.js'
                }]
            }
        },

        watch: {
            src: {
                files: ['src/**/*.js'],
                tasks: ['babel'],
                options: {
                    spawn: false,
                    atBegin: true
                }
            },
            srcAssets: {
                files: ['**/*', '!**/*.js'],
                tasks: ['copy:srcAssets'],
                options: {
                    spawn: false,
                    atBegin: true
                }
            },
            pluginAssets: {
                files: ['plugin.json', 'README.md', 'img/**/*'],
                tasks: ['copy:pluginAssets'],
                options: {
                    spawn: false,
                    atBegin: true
                }
            }
        }

    });

    grunt.registerTask('default', ['clean', 'copy', 'babel']);

    grunt.registerTask('test', 'stub for tests', function () {
        grunt.log.ok();
    });

};

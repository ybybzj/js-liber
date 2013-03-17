module.exports = function(grunt){
	grunt.loadNpmTasks('grunt-exec');
	grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
		exec:{
			build: {
				command : 'node node_modules/.bin/r.js -o build-config.js'
			},
            test: {
                command : 'node_modules/.bin/mocha -u tdd'
            },
            clear: {
                command : 'rm -rf build'
            }
		}
	});

	grunt.registerTask('default', ['exec:clear', 'exec:build']);
};

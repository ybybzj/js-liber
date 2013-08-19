module.exports = function(grunt){
	grunt.loadNpmTasks('grunt-exec');
	grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
		exec:{
			build: {
				command : 'node node_modules/requirejs/bin/r.js -o build-config.js'
			},
            		test: {
                		command : 'node_modules/.bin/mocha -u tdd'
            		}
		}
	});
	grunt.registerTask('clean', function(){
		if(grunt.file.exsit('./build')){
			grunt.file.delete('./build');
		}
	});

	grunt.registerTask('default', ['clean', 'exec:build']);
};

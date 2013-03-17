var assert = require('assert');
var _ = require('../build/liber');
var should = require('should');
var Schedule = _.Flow;

describe("Schedule",function(){
	describe("import",function(){
		it("should be successful!",function(){
			assert.ok(_.isFunction(Schedule));
		});
	});

});

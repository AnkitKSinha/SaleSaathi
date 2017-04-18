var request = require("request");


var products = [50, 50, 50, 50];

var whichProduct = 0;
var quantitySold = 0;
var quantityRemaining;
setInterval(function(){
	whichProduct = (Math.floor(Math.random() * (4 - 1)) + 1);
	quantitySold = (Math.floor(Math.random() * (5)) + 0);
	quantityRemaining = products[whichProduct] - quantitySold;
	products[whichProduct] = quantityRemaining;

	var reqQuery = "http://192.168.1.104:3000/data?p_id=" + whichProduct + "&p_data="+quantityRemaining;
	console.log(reqQuery);
	var res = request.get(reqQuery).on('response', function(result){
		
	});
	console.log("POSTED");
}, 1000);
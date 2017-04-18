module.exports = function(io){
	var express = require('express');
	var router = express.Router();
	var mysql = require("mysql");
	var hbs = require("hbs");
	var async = require("async");
	var regression  = require("regression");


	hbs.registerHelper('parseJson', function(context) {
	    return JSON.stringify(context);
	});

	var connection = mysql.createConnection({
						host:'localhost',
						user : USER_NAME,
						password : PASSWORD,
						database : 'kludge'
					});
	 
	connection.connect(function(err){
		if(err){
		  console.log(err);
		}else{
		  console.log("Connected as id" + connection.threadId);
		}
	});


	/* GET home page. */
	router.get('/', function(req, res, next) {
		console.log("HERE");
	  res.render('index', { title: 'Express' });
	});
	router.get('/test', function(req, res, next){
		// var max = [0, 0, 0];
		// for(var i=0; i<3; i++){
		// 	for(var j = 0; j<5; j++){
		// 		connection.query({
		// 			sql : 'insert into daily_records(p_id, profit, date) values(?, ?, ?)',
		// 			values : [(i+1), max[i]+=(Math.floor(Math.random() * (100)) + 0), ]

		// 		}, function(e, r, f){
		// 			if(e){
		// 				console.log(e);
		// 			}
		// 		});
		// 	}
		// }
		
	});


	router.get('/data', function(req, res, next){
		if(!req.query.p_id || !req.query.p_data){
			res.send("UNSUCCESSFUL");
			return;
		}


		console.log("device Id: " + req.query.p_id);
		console.log("device data : "+ req.query.p_data);
		var profitPerUnit = 0;
		if(req.query.p_data != 0){
			var currentTime;

			connection.query({
				sql : 'select profit, quantity from products pr, initial i where pr.p_id = i.p_id and pr.p_id = ?',
				values : [req.query.p_id]
			}, function(e, res, f){
				if(e){
					console.log("Error in deriving profit per unit");
				}else{
					profitPerUnit = res[0].profit;
					initalQuantity = res[0].quantity;
					connection.query({
						sql : 'insert into dynamic(p_id, remaining, profit, time) values(?, ?, ?, ?)',
						values : [req.query.p_id, req.query.p_data, (initalQuantity - req.query.p_data)*profitPerUnit, Date.now()]

					}, function(e, r, f){
						if(e){
							console.log("Error in inserting dynamic " +e );
						}else{
							console.log("Insertion SUCCESSFUL");
						}
					});
				}
			});
			
		}
		res.send("SUCCESSFUL");
	})

	var indices = [0, 1, 2];

	var swap = function(x, y){
		var temp = x;
		x = y;
		y = temp;
	}

	var knapsack = function(net, p, c, w){
		var r = [];
		var output = [];
		var data = [];
		var indices = [];
		var profit = 0;
		var n = [];

		console.log("NET "+net);
		console.log("P "+p);

		console.log("c "+c);

		console.log("w "+w);

		for(var i=0; i<net.length - 1; i++){
			n[i] = Math.floor((net[i]/p[i]));
			indices[i] = i;
		}
		for(var i=0;i<net.length -1; i++){
			for(var j=0; j<net.length-i-2;j++){
				if(net[j]<net[j+1]){
					var temp = net[j];
					net[j] = net[j+1];
					net[j+1] = temp;
					temp = indices[j];
					indices[j] = indices[j+1];
					indices[j+1] = temp;
					console.log("EHRE");
				}
			}
		}

		console.log("New net " +net);
		console.log("New Indices " + indices);

		console.log("N : " + n + "\n C :"+c);
		for(var i=0; i<net.length-1; i++){
			console.log("HERE");
			// var t = indices[i];
			var x = n[indices[i]] * c[indices[i]];
			console.log(" x: "+x);
			if(x <= w){
				output[indices[i]] = n[indices[i]];
				// console.log("N[i]" + n[i] + "\nP[i]"+p[i]);
				profit += n[indices[i]]*p[indices[i]];
				w = w-x;
				// if(i==net.length && w>0){
				// 	i=0;
				// }

			}else{
				var z = Math.floor(w/p[indices[i]]);
				w = w-(c[indices[i]]*z);
				output[indices[i]] = z;
			}
			
			console.log("PROFIT IS :\t" +profit);
			// console.log(output);
		}
		return output;


	}


	io.on("connection", function(socket){
		console.log("connected");
		socket.on("test_socket", function(){
			console.log("TESTING SUCCESSFUL");
		});

		socket.on("check_stock", function(){

			indices = [0, 1, 2];
			var ret = {};
			ret.products = [];
			async.each(indices, function(i, callback){
				connection.query({
					sql : 'select * from dynamic where p_id = ? order by p_id asc, time desc Limit 1',
					values : [i+1]
				}, function(e, r, f){
					if(e){
						console.log("error checking stock " + e);
					}else{
						console.log("Inside "+ i);
						// console.log(r);
						if(r.length){
							console.log("HERE");
							item = {};
							item.name = "pr"+(i+1);
							item.value = r[0].remaining;
							item.profit = r[0].profit;
							console.log("TIME:\t" + r[0].time);
							var t = new Date(parseInt(r[0].time));
							console.log("Month:\t"+(t.getMonth()).toString());
							var month = ((t.getMonth()).toString());
							console.log("LENGHT : " + month.length);

							item.when =((t.getFullYear() + '-' + ((month.length == 1)?('0'+month):(month))+"-" + t.getDate()) +" "+ (t.toString()).substr(16, 8));
							console.log("ITEM WHEN " + '2017-04-14 22:38:00');
							ret.products.push(item);
							console.log("products is : "+ item);
						}else{
							console.log("NO DATA");
						}
					}


					if(i == 2 ){
						console.log("THIS : " + JSON.stringify(ret));
						socket.emit("stock_checked", ret);
					}
				});

				
			});
				
			
		});

		socket.on('regression_req', function(){

			
			var predicted = [];
			var indices = [1, 2, 3];
			var netProfit = [1000, 2500, 1400];
			var profitPerUnit = [10, 8, 11];
			var costPrice = [15, 10, 20];


			async.each(indices, function(i, callback){
				connection.query({
					sql : 'select profit, date from daily_records where p_id = ? order by date asc',
					values : [i]
				}, function(e, r, f){
					if(!e){
						console.log(JSON.stringify(r));
						var data = [];
						for(var j=0; j<r.length || j<30; j++){
							if(r[j]){
								var d = new Date(r[j].date);
								item = [];
								item[0] = d.getDate();
								item[1] = r[j].profit;
								data.push(item);
								// console.log("pushing " + item);
							}else{
								item = [];
								item[0] = j;
								item[1] = null;
								data.push(item);
								// console.log("pushing " + item);
							}
						}
						var results = regression('linear', data);
						// console.log(results.points);
						predicted.push(results.points);
						for(var j=0; j<results.points.length; j++){
							// netProfit[i] += results.points[j][1];
						}

						if(i == 3){
							console.log("Net Profit " + netProfit);
							var out = knapsack(netProfit, profitPerUnit, costPrice, 100000000);
							out = [60, 40, 30];
							console.log(out);
							socket.emit('regression_res', predicted, out);
						}

					}else{
						console.log("Error");
					}
				});
				
			});	
			
		});
	});

	return router;

}

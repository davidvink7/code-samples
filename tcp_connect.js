var net = require("net");
var _ = require("lodash");

var config = require("./config");
var utils = require("./utils");

var is_test = (process.NODE_ENV != "production");
var test_processing = false;

var delimiter = ":::";

if(config.tcp_connect === undefined || config.tcp_connect.role == "none"){
	module.exports = exports = undefined;
} else {
	var webhook_connect;
	var process_connect;
	var listening_funct = (data) => { console.log("CONNECTED TO TCP") }

	var error_func = (role) => (err) => {
		if(err.code == "ECONNREFUSED"){
			eval(role+"_connect").emit('end');
		} else {
			console.error(err);
		}
	}

	var end_func = (role) => (err) => {
		process.emit("SIGTERM");
	};

	var process_data_handle = function(data){
		data = data.toString();
		console.log("PROCESSOR TOLD TO PROCESS:: "+data);
		if(test_processing){
			setTimeout(() => {
				process_connect.write(data+delimiter+"1111");
			},2000); //wait 2 seconds before sending the data back - a rough aproximation of real processing.
		} else {
			var process_order = require("./routes/orders").processing;
			let order_data = data.split(delimiter);
			if(order_data[0] === "process"){
				let order_hash = order_data[1].split("^^^");
				order_data = {
					"order_hash":order_data[1],
					"order_id":order_data[2],
					"uid":order_hash[0],
					"order_name": order_hash[1]
				}
				if(is_test){ console.log(JSON.stringify(order_data,null,2)); }
				console.log(`process_order is a ${typeof process_order}`);
				process_order(order_data.uid,order_data.order_name,order_data.order_id,(err,res_data) => {
					let action;

					if(err){
						if(_.has(err,'action')) action = err.action;
						else err = utils.err_wrapper(err);
					}

					if(res_data !== undefined){
						action = res_data;
					}

					if(!_.isString(action)){
						action = JSON.stringify(action);
					}

					process_connect.write(data+delimiter+action);
				})
			}
		}
	};

	var build_socket = (role) => (callback) => {
		let socket = net.createConnection(config.tcp_connect.port,config.tcp_connect.host,listening_funct);
		socket.write(`setRole${delimiter}${role}`);
		socket.on('error',error_func(role));
		socket.on('end',end_func(role));
		if(role == "process"){
			socket.on('data',process_data_handle)
		}
		callback(socket);
	}

	if(config.tcp_connect.role == "webhook" || config.tcp_connect.role == "both"){
		build_socket('webhook')((socket) => { webhook_connect = socket; return; });
	}

	if(config.tcp_connect.role == "process" || config.tcp_connect.role == "both"){
		build_socket('process')((socket) => { process_connect = socket; return; });
	}

	module.exports = exports = {
		"webhook":{
			"process": function(){
				webhook_connect.write(`process${delimiter}PING`);
			}
		}
	}
}
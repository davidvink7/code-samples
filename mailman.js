var nodemailer = require('nodemailer');
var config = require("./config");
var _ = require("lodash");
var moment = require("moment");

var standard_next = (err) => {
	if(err){
		let this_moment = moment();
		console.error(`[TIMESTAMP] ${this_moment.format("YYYY-MM-DD HH:mm:ss.SSS")}`);
		console.log(`[TIMESTAMP] ${this_moment.format("YYYY-MM-DD HH:mm:ss.SSS")}`);
		console.error(err);
		console.log("EMAIL ERROR");
	}
};

var sent_error_recently = false;

setTimeout(function(){
	if(sent_error_recently){
		console.log("RESETTING EMAIL TRIGGER");
		sent_error_recently = false;
	}
},1000*60*2);

module.exports = exports = {
	"send_billing_email": function(html,db_data,next){
			if(!config.mail_config.enabled){
				return next();
			}

			var transport = nodemailer.createTransport("SMTP",{
		    service: "Gmail",
		    auth: {
		        user: config.mail_config.username,
		        pass: config.mail_config.password
		    }
			});

			var mail_options = {
				from: config.mail_config.username,
				to: "alert@company.com",
				subject: "Company requesting Shopify Recurring Billing.",
				html: html
			};

			transport.sendMail(mail_options,err => next(err));
	},

	"send_uninstall_email": function(shop,next) {
		if(!config.mail_config.enabled){
			return next();
		}

		var transport = nodemailer.createTransport("SMTP",{
	    service: "Gmail",
	    auth: {
	        user: config.mail_config.username,
	        pass: config.mail_config.password
	    }
		});

		var mail_options = {
			from: config.mail_config.username,
			to: config.mail_config.toWhom,
			subject: "Shop Uninstalled",
			text: "The shop http://"+shop+" has uninstalled Company with Shopify."
		};

		transport.sendMail(mail_options,err => next(err));
	},

	"send_customer_erase": function(data,next){
		if(_.isUndefined(next)){
			next = standard_next
		}

		if(_.isUndefined(data) || _.isNull(data) || _.isEmpty(data)){
			return next();
		}

		var transport = nodemailer.createTransport("SMTP",{
	    service: "Gmail",
	    auth: {
	        user: config.mail_config.username,
	        pass: config.mail_config.password
	    }
		});

		var mail_options = {
			from: config.mail_config.username,
			to: config.mail_config.toWhom,
			subject: `[Shopify] Customer Erase Event at ${moment().format("YYYY-MM-DD HH:mm:ss.SSS")}`,
			text: `${JSON.stringify(data,null,2)}`
		};

		if(!sent_error_recently){
			transport.sendMail(mail_options,err => { sent_error_recently = true; return next(err); });
		} else {
			return next();
		}
	},

	"send_customer_request": function(data,next){
		if(_.isUndefined(next)){
			next = standard_next
		}

		if(_.isUndefined(data) || _.isNull(data) || _.isEmpty(data)){
			return next();
		}

		var transport = nodemailer.createTransport("SMTP",{
	    service: "Gmail",
	    auth: {
	        user: config.mail_config.username,
	        pass: config.mail_config.password
	    }
		});

		var mail_options = {
			from: config.mail_config.username,
			to: config.mail_config.toWhom,
			subject: `[Shopify] Customer Request Data at ${moment().format("YYYY-MM-DD HH:mm:ss.SSS")}`,
			text: `${JSON.stringify(data,null,2)}`
		};

		if(!sent_error_recently){
			transport.sendMail(mail_options,err => { sent_error_recently = true; return next(err); });
		} else {
			return next();
		}
	},

	"send_merchant_erase": function(data,next){
		if(_.isUndefined(next)){
			next = standard_next
		}

		if(_.isUndefined(data) || _.isNull(data) || _.isEmpty(data)){
			return next();
		}

		var transport = nodemailer.createTransport("SMTP",{
	    service: "Gmail",
	    auth: {
	        user: config.mail_config.username,
	        pass: config.mail_config.password
	    }
		});

		var mail_options = {
			from: config.mail_config.username,
			to: config.mail_config.toWhom,
			subject: `[Shopify] Merchant Erase Event at ${moment().format("YYYY-MM-DD HH:mm:ss.SSS")}`,
			text: `${JSON.stringify(data,null,2)}`
		};

		if(!sent_error_recently){
			transport.sendMail(mail_options,err => { sent_error_recently = true; return next(err); });
		} else {
			return next();
		}
	},

	"send_error_email": function(err,next){
		if(_.isUndefined(next)){
			next = standard_next
		}

		if(!config.error_mail_config.enabled){
			return next();
		}

		if(_.isUndefined(err) || _.isNull(err) || _.isEmpty(err)){
			return next();
		}

		if(_.has(err,'error') || _.has(err,'err')){
			if(_.isUndefined(err.err) || _.isNull(err.err) || _.isEmpty(err.err) || _.isUndefined(err.error) || _.isNull(err.error) || _.isEmpty(err.error)){
				return next();
			}
		}

		var transport = nodemailer.createTransport("SMTP",{
	    service: "Gmail",
	    auth: {
	        user: config.error_mail_config.username,
	        pass: config.error_mail_config.password
	    }
		});

		var mail_options = {
			from: config.error_mail_config.username,
			to: config.error_mail_config.toWhom,
			subject: `[Shopify] ERROR at ${moment().format("YYYY-MM-DD HH:mm:ss.SSS")}`,
			text: `${err.code}\n${JSON.stringify(err,null,2)}\n${(err.stack) ? err.stack : ""}`
		};

		if(!sent_error_recently){
			transport.sendMail(mail_options,err => { sent_error_recently = true; return next(err); });
		} else {
			return next();
		}
	}
};
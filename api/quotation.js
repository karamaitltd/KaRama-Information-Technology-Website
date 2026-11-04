'use strict';
const {createHandler,validate}=require('../lib/enquiries');
module.exports=createHandler('quotation');
module.exports.validate=body=>validate(body,'quotation');

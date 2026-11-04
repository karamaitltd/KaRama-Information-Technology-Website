'use strict';
const {createHandler,validate}=require('../lib/enquiries');
module.exports=createHandler('contact');
module.exports.validate=body=>validate(body,'contact');

const cipher_data = (data) => {
  if(!_.isString(data) && !_.isPlainObject(data)){
    data = _.toString(data);
  } else if(_.isPlainObject(data)){
    data = JSON.stringify(data);
  }

  let crypt_iv = crypto.randomBytes(16);
  let cipher = crypto.createCipheriv(crypt_algo,crypt_key,crypt_iv);
  let crypted_data = cipher.update(data,'utf8','base64');
  crypted_data += cipher.final('base64');
  crypt_iv = Buffer.from(crypt_iv).toString('base64');
  return [ crypted_data, crypt_iv ];
};

const decipher_data = (data, nonce) => {
  if(nonce == undefined){
    return data;
  } else {
    let new_data;
    let decipher = crypto.createDecipheriv(crypt_algo,crypt_key,Buffer.from(nonce,'base64'));
    new_data = decipher.update(data,'base64','utf8');
    new_data += decipher.final('utf8');
    return new_data;
  }
}
/**
 * Delivery Management System Demo - Google Apps Script backend
 * Deploy as Web App: Execute as Me, Who has access: Anyone.
 * IMPORTANT: This is a demo backend, not production authentication/security.
 */
const SHEETS = {
  Users:['user_id','username','password','full_name','role','phone','active','created_at'],
  DeliveryStaff:['delivery_staff_id','user_id','staff_code','name','phone','address','vehicle_type','vehicle_no','profile_photo','status'],
  OnlineShops:['shop_id','shop_name','owner_name','phone','address','facebook_page','email','status','created_at'],
  Parcels:['parcel_id','tracking_no','shop_id','receiver_name','receiver_phone','receiver_address','township','parcel_image','cod_amount','delivery_fee','current_status','active','cancelled','created_by','created_at','updated_at'],
  Assignments:['assignment_id','parcel_id','delivery_staff_id','assigned_by','assigned_at','unassigned_at','is_current','note'],
  StatusHistory:['status_history_id','parcel_id','assignment_id','status','fail_reason','changed_by','changed_at','note'],
  FailReasons:['fail_reason_id','reason','active'],
  ActionLogs:['action_log_id','user_id','user_name','action_type','entity_type','entity_id','old_value','new_value','action_at']
};

function doGet(e){
  try{
    ensureSheets_();
    const action=(e && e.parameter && e.parameter.action)||'health';
    if(action==='bootstrap') return json_({ok:true,data:bootstrap_()});
    return json_({ok:true,message:'Delivery Demo API is running'});
  }catch(err){return json_({ok:false,error:String(err && err.message || err)});}
}

function doPost(e){
  try{
    ensureSheets_();
    const raw=(e && e.parameter && e.parameter.payload) || (e && e.postData && e.postData.contents) || '{}';
    const req=JSON.parse(raw);
    const action=req.action;
    if(action==='login') return json_(login_(req.username,req.password));
    if(action==='saveShop') return json_({ok:true,record:upsert_('OnlineShops','shop_id',req.record)});
    if(action==='saveDeliveryStaff') return json_({ok:true,record:upsert_('DeliveryStaff','delivery_staff_id',req.record)});
    if(action==='saveUser') return json_({ok:true,record:upsert_('Users','user_id',req.record)});
    if(action==='saveParcel') return json_({ok:true,record:saveParcel_(req.record)});
    if(action==='assignParcel') return json_({ok:true,record:assignParcel_(req)});
    if(action==='updateStatus') return json_({ok:true,record:updateStatus_(req)});
    if(action==='cancelParcel') return json_({ok:true,record:cancelParcel_(req.parcel_id)});
    if(action==='logAction') return json_({ok:true,record:upsert_('ActionLogs','action_log_id',req.record)});
    return json_({ok:false,error:'Unknown action: '+action});
  }catch(err){return json_({ok:false,error:String(err && err.message || err)});}
}

function setupDemo(){
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SHEETS).forEach(name=>{
    let sh=ss.getSheetByName(name);if(!sh)sh=ss.insertSheet(name);sh.clear();sh.getRange(1,1,1,SHEETS[name].length).setValues([SHEETS[name]]);sh.setFrozenRows(1);
  });
  const t=new Date().toISOString();
  append_('Users',{user_id:'U-ADMIN',username:'admin',password:'admin123',full_name:'System Admin',role:'ADMIN',phone:'09-111111111',active:true,created_at:t});
  append_('Users',{user_id:'U-STAFF',username:'staff',password:'staff123',full_name:'Operations Staff',role:'STAFF',phone:'09-222222222',active:true,created_at:t});
  append_('Users',{user_id:'U-DEL1',username:'delivery',password:'delivery123',full_name:'Mg Aung',role:'DELIVERY',phone:'09-333333333',active:true,created_at:t});
  append_('Users',{user_id:'U-DEL2',username:'delivery2',password:'delivery123',full_name:'Ko Min',role:'DELIVERY',phone:'09-444444444',active:true,created_at:t});
  append_('DeliveryStaff',{delivery_staff_id:'DS-001',user_id:'U-DEL1',staff_code:'DLV-001',name:'Mg Aung',phone:'09-333333333',address:'Hlaing, Yangon',vehicle_type:'Motorbike',vehicle_no:'YGN-1234',profile_photo:'',status:'ACTIVE'});
  append_('DeliveryStaff',{delivery_staff_id:'DS-002',user_id:'U-DEL2',staff_code:'DLV-002',name:'Ko Min',phone:'09-444444444',address:'Kamayut, Yangon',vehicle_type:'Motorbike',vehicle_no:'YGN-5678',profile_photo:'',status:'ACTIVE'});
  append_('OnlineShops',{shop_id:'SHOP-001',shop_name:'Glow Online Shop',owner_name:'Su Su',phone:'09-770000001',address:'Sanchaung, Yangon',facebook_page:'Glow Online Shop',email:'glow@example.com',status:'ACTIVE',created_at:t});
  append_('OnlineShops',{shop_id:'SHOP-002',shop_name:'Trend Hub',owner_name:'May',phone:'09-770000002',address:'Hlaing, Yangon',facebook_page:'Trend Hub MM',email:'trend@example.com',status:'ACTIVE',created_at:t});
  ['Receiver unavailable','Phone unreachable','Wrong address','Receiver rejected parcel','Other'].forEach((r,i)=>append_('FailReasons',{fail_reason_id:'FR-'+(i+1),reason:r,active:true}));
  return 'Demo sheets created. Deploy this Apps Script as a Web App next.';
}

function ensureSheets_(){
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SHEETS).forEach(name=>{let sh=ss.getSheetByName(name);if(!sh){sh=ss.insertSheet(name);sh.getRange(1,1,1,SHEETS[name].length).setValues([SHEETS[name]]);sh.setFrozenRows(1);}});
}

function bootstrap_(){
  const users=getAll_('Users').map(u=>{const x=Object.assign({},u);delete x.password;return x;});
  return {
    users:users,
    deliveryStaff:getAll_('DeliveryStaff'),
    shops:getAll_('OnlineShops'),
    parcels:getAll_('Parcels'),
    assignments:getAll_('Assignments'),
    statusHistory:getAll_('StatusHistory'),
    actionLogs:getAll_('ActionLogs').reverse(),
    failReasons:getAll_('FailReasons').filter(x=>truthy_(x.active)).map(x=>x.reason)
  };
}

function login_(username,password){
  const user=getAll_('Users').find(u=>String(u.username)===String(username)&&String(u.password)===String(password)&&truthy_(u.active));
  if(!user)return {ok:false,error:'Invalid username or password'};
  const safe=Object.assign({},user);delete safe.password;return {ok:true,user:safe};
}

function saveParcel_(record){
  const r=Object.assign({},record);
  if(r.parcel_image && String(r.parcel_image).indexOf('data:image/')===0){r.parcel_image=saveImage_(r.parcel_image,r.tracking_no||r.parcel_id);}
  return upsert_('Parcels','parcel_id',r);
}

function assignParcel_(req){
  const a=req.assignment;
  if(req.previous_assignment_id){
    const old=findRow_('Assignments','assignment_id',req.previous_assignment_id);
    if(old){old.record.is_current=false;old.record.unassigned_at=new Date().toISOString();writeRow_('Assignments',old.row,old.record);}
  }
  upsert_('Assignments','assignment_id',a);
  const p=findRow_('Parcels','parcel_id',req.parcel_id);
  if(p){p.record.current_status='ASSIGNED';p.record.updated_at=new Date().toISOString();writeRow_('Parcels',p.row,p.record);}
  upsert_('StatusHistory','status_history_id',{status_history_id:id_('SH'),parcel_id:req.parcel_id,assignment_id:a.assignment_id,status:'ASSIGNED',fail_reason:'',changed_by:a.assigned_by,changed_at:new Date().toISOString(),note:'Assigned/Reassigned'});
  return a;
}

function updateStatus_(req){
  const p=findRow_('Parcels','parcel_id',req.parcel_id);
  if(p){p.record.current_status=req.status;p.record.updated_at=new Date().toISOString();writeRow_('Parcels',p.row,p.record);}
  return upsert_('StatusHistory','status_history_id',req.record);
}

function cancelParcel_(parcelId){
  const p=findRow_('Parcels','parcel_id',parcelId);if(!p)throw new Error('Parcel not found');
  p.record.current_status='CANCELLED';p.record.active=false;p.record.cancelled=true;p.record.updated_at=new Date().toISOString();writeRow_('Parcels',p.row,p.record);return p.record;
}

function saveImage_(dataUrl,baseName){
  const m=String(dataUrl).match(/^data:(image\/[^;]+);base64,(.+)$/);if(!m)return dataUrl;
  const mime=m[1],bytes=Utilities.base64Decode(m[2]);const ext=mime.indexOf('png')>=0?'png':'jpg';
  const folders=DriveApp.getFoldersByName('DeliveryDemoUploads');const folder=folders.hasNext()?folders.next():DriveApp.createFolder('DeliveryDemoUploads');
  const file=folder.createFile(Utilities.newBlob(bytes,mime,(baseName||'parcel')+'.'+ext));
  return file.getUrl();
}

function getAll_(name){
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);if(!sh||sh.getLastRow()<2)return[];
  const vals=sh.getRange(1,1,sh.getLastRow(),SHEETS[name].length).getValues(),headers=vals[0];
  return vals.slice(1).filter(r=>r.some(v=>v!==''&&v!==null)).map(r=>{const o={};headers.forEach((h,i)=>o[h]=normalize_(r[i]));return o;});
}
function append_(name,record){const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);sh.appendRow(SHEETS[name].map(h=>record[h]!==undefined?record[h]:''));return record;}
function upsert_(name,key,record){const found=findRow_(name,key,record[key]);if(found){writeRow_(name,found.row,record);return record;}return append_(name,record);}
function findRow_(name,key,val){const rows=getAll_(name);for(let i=0;i<rows.length;i++)if(String(rows[i][key])===String(val))return{row:i+2,record:rows[i]};return null;}
function writeRow_(name,row,record){const sh=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);sh.getRange(row,1,1,SHEETS[name].length).setValues([SHEETS[name].map(h=>record[h]!==undefined?record[h]:'')]);}
function normalize_(v){return v instanceof Date?v.toISOString():v;}
function truthy_(v){return v===true||String(v).toLowerCase()==='true'||String(v)==='1';}
function id_(p){return p+'-'+new Date().getTime()+'-'+Math.floor(Math.random()*10000);}
function json_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}

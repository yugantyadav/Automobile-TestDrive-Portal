// ATDP API wrapper — frontend on :3000, backend on :5000 (different ports = separate localStorage for simultaneous admin/user)
const API_BASE = (location.port === '3000') ? 'http://localhost:5000' : location.origin;
function api(path, opts={}) {
  const token = localStorage.getItem('atdp_token');
  const headers = { 'Content-Type':'application/json', ...(opts.headers||{}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(`${API_BASE}${path}`, { ...opts, headers }).then(async r=>{
    const data = await r.json().catch(()=>({}));
    if (!r.ok) throw new Error(data.message || `HTTP ${r.status}`);
    return data;
  });
}
const AuthAPI = {
  register: (payload)=> api('/api/auth/register',{method:'POST',body:JSON.stringify(payload)}),
  login: (payload)=> api('/api/auth/login',{method:'POST',body:JSON.stringify(payload)}),
  profile: ()=> api('/api/auth/profile'),
  updateProfile: (payload)=> api('/api/auth/profile',{method:'PUT',body:JSON.stringify(payload)}),
  changePassword: (payload)=> api('/api/auth/change-password',{method:'PUT',body:JSON.stringify(payload)}),
};
function cleanParams(p){
  const o={};
  for(const [k,v] of Object.entries(p)){
    if(v!==undefined && v!==null && v!=='') o[k]=v;
  }
  return o;
}
const VehicleAPI = {
  list: (params={})=>{ const qs=new URLSearchParams(cleanParams(params)).toString(); return api(`/api/vehicles${qs?'?'+qs:''}`)},
  brands: ()=> api('/api/vehicles/brands'),
  get: (id)=> api(`/api/vehicles/${id}`),
};
const ShowroomAPI = {
  list: (params={})=>{ const qs=new URLSearchParams(cleanParams(params)).toString(); return api(`/api/showrooms${qs?'?'+qs:''}`)},
};
const BookingAPI = {
  list: (params={})=>{ const qs=new URLSearchParams(cleanParams(params)).toString(); return api(`/api/bookings${qs?'?'+qs:''}`)},
  slots: (showroom_id, booking_date)=> api(`/api/bookings/available-slots?showroom_id=${showroom_id}&booking_date=${booking_date}`),
  create: (payload)=> api('/api/bookings',{method:'POST',body:JSON.stringify(payload)}),
  update: (id, status, admin_message)=> {
    const body={status};
    if(admin_message!==undefined) body.admin_message=admin_message;
    return api(`/api/bookings/${id}`,{method:'PUT',body:JSON.stringify(body)});
  },
  remove: (id)=> api(`/api/bookings/${id}`,{method:'DELETE'}),
  get: (id)=> api(`/api/bookings/${id}`),
};
const AdminAPI = {
  dashboard: ()=> api('/api/admin/dashboard'),
  users: (params={})=>{ const qs=new URLSearchParams(cleanParams(params)).toString(); return api(`/api/admin/users${qs?'?'+qs:''}`)},
  bookings: (params={})=>{ const qs=new URLSearchParams(cleanParams(params)).toString(); return api(`/api/admin/bookings${qs?'?'+qs:''}`)},
};
const ReviewAPI = {
  list: (params={})=> { const qs=new URLSearchParams(cleanParams(params)).toString(); return api(`/api/reviews${qs?'?'+qs:''}`)},
  summary: (vehicle_id)=> api(`/api/reviews/vehicle/${vehicle_id}/summary`),
  create: (payload)=> api('/api/reviews',{method:'POST',body:JSON.stringify(payload)}),
};
function formatINR(amount){
  return new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(amount);
}

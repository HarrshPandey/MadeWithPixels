// Uptime probe: point UptimeRobot (or any monitor) at https://madeofpixels.in/api/health
module.exports=(req,res)=>{
  res.statusCode=200; res.setHeader('Content-Type','application/json'); res.setHeader('Cache-Control','no-store');
  res.end(req.method==='HEAD'?'':JSON.stringify({ok:true,site:'madeofpixels.in',time:new Date().toISOString()}));
};

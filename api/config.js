export default function handler(req,res){
  res.status(410).json({onlineConfigured:false,disabled:true,message:'Conta/cloud save desativados. PSYWORLD usa save local V7.'});
}

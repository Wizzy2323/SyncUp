import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { serverUrl } from '../main';
import { useDispatch,useSelector } from 'react-redux';
//import { setUserData } from '../redux/userSlice';
import { setUserData, setSelectedUser } from '../redux/userSlice';

function  Login(){
    let navigate = useNavigate()
    let [show, setshow] = useState(false);
    
    
    let [email,setEmail]=useState("")
    let [password,setPassword]=useState("")
    let [loading,setLoading]=useState(false);
  let [err,seterr]=useState("");

  let dispatch=useDispatch()

   let {userData}=useSelector(state=>state.user)

    console.log(userData);
    const handleLogin=async (e)=>{
        e.preventDefault()
        setLoading(true);
        try{
            let result=await axios.post(`${serverUrl}/api/auth/login`,{
email,password
            },{withCredentials:true})
      console.log(result) 
      dispatch(setUserData(result.data))
      dispatch(setSelectedUser(null))
      navigate("/profile")
    setEmail("")
    setPassword("")
    setLoading(false);

    }
        catch(error){
// console.log(error);
console.log(error.response.data);
    setLoading(false);
     seterr(error.response.data.message);

        }
    }




    return (
        <div className='w-full min-h-screen bg-orange-100
         flex items-center justify-center p-4'>
            <div className='w-full max-w-[500px] h-[600px] bg-slate-200 rounded-lg shadow-gray-400 shadow-lg
            flex flex-col gap-[35px] rounded-b-[5%] rounded-t-[5%] overflow-hidden'>
                
                <div className='w-full h-[200px] bg-blue-400 rounded-b-[30%] shadow-gray-100 shadow-lg
                flex items-center justify-center'>
                    <h1 className='text-black font-bold text-[38px]'>Login To <span className='text-white'>ConvoSphere</span></h1>
                </div>
                
                <form className='w-full flex flex-col gap-[20px] items-center' onSubmit={handleLogin}>

               
                    {/* Email Input - Fixed height to 50px */}
                    <input type="email" placeholder='email' className='w-[90%] h-[50px] outline-none border-2 border-[#b60764]
                    px-[20px] py-[10px] bg-white rounded-lg shadow-gray-400 shadow-lg text-gray-600 text-[19px]' onChange={(e)=>setEmail(e.target.value)} value={email}/>

                    {/* Password Wrapper - Adjusted height to h-[50px] to match the others */}
                    <div className='w-[90%] h-[50px] border-2 border-[#b60764] rounded-lg relative bg-white shadow-gray-400 shadow-lg flex items-center'>
                        <input 
                            type={show ? "text" : "password"} 
                            placeholder='password'
                            className='w-full h-full outline-none px-[20px] pr-[70px] py-[10px] bg-transparent text-gray-600 text-[19px]'   onChange={(e)=>setPassword(e.target.value)}
                        value={password}
                        />
                        {/* Fixed Tailwind 'right-[20px]', syntax braces, and pointer cursor */}
                        <span 
                            className='absolute right-[20px] text-[16px] font-bold text-[#b60764] cursor-pointer select-none' 
                            onClick={() => setshow(prev => !prev)}
                        >
                            {show ? "hidden" : "show"}
                        </span>
                    </div>
{err && <p>{err}</p>}
                    {/* Sign Up Button - Fixed space in mt-[20px] */}
                    <button className='px-[20px] py-[10px] 
                    bg-blue-400 shadow-lg text-[20px] w-[200px] mt-[20px] font-semibold hover:shadow-inner rounded-lg'   disabled={loading}>{loading?"Loading...":"Login"}</button>
                    
                    <p className='cursor-pointer' onClick={() => navigate("/signup")}>
                        Want To Create A New Account ? <span className='text-[#61064f] font-bold'>Sign Up</span>
                    </p>
                </form>
            </div>
        </div>
    )
}


export default Login
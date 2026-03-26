import { redirect } from "next/navigation";
import { auth } from "./auth";
import { headers } from "next/headers";

export const authSession = async ()  => {
    const session =  auth.api.getSession({headers: await headers()});
    try{
        if(!session){
            throw new Error('Unauthorized: No active session found!');
        }
        return session;
    }
    catch{
        throw new Error('Authentication failed!');
    }
}

export const authIsRequired = async () => {
    const session =  authSession();
    if(!session){
        redirect('/sign-in')
    }

    return session;
}

export const authIsNotRequired = async () => {
    const session = await authSession();
    if(session){
        redirect('/')
    }

}
import { Inngest } from "inngest";
import connectDB from "./db";
import User from "@/models/User";
import Order from "@/models/Order";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "gamecart-next" });

// inngest function to save user data to a database
export const syncUserCreation = inngest.createFunction(
    {
        id:'sync-user-from-clerk'
    },
    { event:'clerk/user.created'},
    async ({event}) => {
        const { id, first_name, last_name, email_addresses, image_url} = event.data
        const userData = {
            _id:id,
            email:email_addresses[0].email_address,
            name: first_name + ' ' + last_name,
            imageUrl: image_url
        }
        await connectDB()
        await User.create(userData)
    }
)

// Inngest Function to update user data in database
export const syncUserUpdation = inngest.createFunction(
    {
        id: 'update-user-from-clerk'
    },
    { event: 'clerk/user.updated'},
    async({event}) => {
        const { id, first_name, last_name, email_addresses, image_url} = event.data
        const userData = {
            _id:id,
            email:email_addresses[0].email_address,
            name: first_name + ' ' + last_name,
            imageUrl: image_url
        }
        await connectDB()
        await User.findByIdAndUpdate(id,userData)
    }
)

// Inngest Function to delete user from database
export const syncUserDeletion = inngest.createFunction(
    {
        id:'delete-user-from-clerk'
    },
    { event: 'clerk/user.deleted'},
    async({event}) =>{
        const{id} = event.data
        await connectDB()
        await User.findByIdAndDelete(id)
    }
)


// Inngest Function to create user's order in database
export const createUserOrder = inngest.createFunction(
    {
        id:'create-user-order',
        batchEvents:{
            maxSize: 5,
            timeout: '5s'
        }
    },
    {event: 'order/created'},
    async ({events}) => {
        const orders = events.map(()=> {
            return {
                userId: Event.data.userId,
                items: Event.data.items,
                amount: Event.data.amount,
                address: Event.data.address,
                date: Event.data.date
            }
        })

        await connectDB()
        await Order.insertMany(orders)

        return {success:true, processes: orders.length};
    }
)
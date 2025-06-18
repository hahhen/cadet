"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

//READ
export async function getUsers() {
    try {
        const users = await prisma.user.findMany({
            orderBy: {
                createdAt: "desc"
            }
        })
        return users
    }
    catch (error) {
        console.error("Error fetching users:", error)
        return []
    }
}

export async function getUserQuery(props: { kindeId?: string, email?: string, username?: string, firstName?: string, lastName?: string, picture?: string, id?: string }) {
    try {
        const user = await prisma.user.findFirst({
            where: props
        })
        return user
    }catch (error) {
        console.error("Error fetching user:", error)
        return null
    }
}

export async function createUser({ kindeId, email, username, firstName, lastName, picture }: { kindeId: string, email: string, username: string, firstName: string, lastName: string, picture?: string }) {
    try {
        const user = await prisma.user.create({
            data: {
                kindeId,
                email,
                username,
                firstName,
                lastName,
                picture
            }
        })
        revalidatePath("/")
        return user
    } catch (error) {
        console.error("Error creating user:", error)
        throw error
    }

}
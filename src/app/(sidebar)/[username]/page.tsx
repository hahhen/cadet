import { getUserQuery } from "@/app/actions";
import Image from "next/image";

export default async function Page({ params }: { params: { username: string } }) {
    const { username } = await params;
    const user = await getUserQuery({ username: username });
    console.log(user);
    return (
        <div className="flex flex-col gap-4 rounded-xl bg-card p-2">
            <Image alt="Picture" className="rounded-xl" src={user?.picture!} width={100} height={100} />
            <div className="flex items-center gap-2">
                <h1 className="scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0">{user?.firstName}{user?.lastName}</h1>
                <span className="bg-muted rounded-md text-muted-foreground py-1 px-2 text-sm">{username}</span>
            </div>
            <div className="flex items-center gap-2">
                {user?.codeForces && (<span className="bg-muted rounded-md text-muted-foreground px-2 text-sm">{user.codeForces.handle} - {user.codeForces.rating}</span>) }
                {user?.hackerRank && (<span className="bg-muted rounded-md text-muted-foreground px-2 text-sm">{user.hackerRank.handle}</span>) }
                {user?.github && (<span className="bg-muted rounded-md text-muted-foreground px-2 text-sm">{user.github}</span>) }
            </div>
            {/* Aqui você pode adicionar mais informações sobre o usuário */}
        </div>
    );
}
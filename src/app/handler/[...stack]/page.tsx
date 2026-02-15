import { isAuthConfigured } from "@/lib/auth";
import ClientStack from "./ClientStack";

export default function Handler(props: { params: any; searchParams: any }) {
    if (!isAuthConfigured) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p className="text-muted-foreground">
                    Stack Auth non configuré. Renseignez les variables d'environnement.
                </p>
            </div>
        );
    }

    // Passe seulement des données simples (pas stackServerApp)
    return <ClientStack routeProps={props} />;
}
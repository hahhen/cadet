// app/api/webhooks/kinde/route.ts
import { NextResponse } from 'next/server';
import { Users, init } from '@kinde/management-api-js';
import { createUser, getUserQuery } from '@/app/actions';
// Importações da biblioteca 'jose' para verificação do JWT
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { generateFromEmail } from "unique-username-generator";


export async function POST(req: Request) {
  try {
    init();
    // 1. Obter o JWT do corpo da requisição
    const jwt = await req.text();
    if (!jwt) {
      return new NextResponse('Corpo da requisição vazio.', { status: 400 });
    }

    // 2. Verificar e decodificar o JWT
    const KINDE_ISSUER_URL = process.env.KINDE_ISSUER_URL;
    if (!KINDE_ISSUER_URL) {
      throw new Error('A variável de ambiente KINDE_ISSUER_URL não está definida.');
    }

    // O JWKS (JSON Web Key Set) é um conjunto de chaves públicas usado para verificar a assinatura
    const JWKS = createRemoteJWKSet(
      new URL(`${KINDE_ISSUER_URL}/.well-known/jwks.json`)
    );

    // jwtVerify faz tudo: verifica a assinatura, o tempo de expiração e o emissor.
    // Se algo estiver errado, ele lançará um erro.
    const { payload } = await jwtVerify(jwt, JWKS);

    console.log("JWT verificado com sucesso. Payload:", payload);

    // 3. Processar o evento
    const eventType = payload.type as string;

    if (eventType === 'user.created') {
      // Extrai os dados do usuário do payload do JWT
      const userData = (payload.data as any).user;

      if (!userData || !userData.id) {
        return new NextResponse('Dados do usuário não encontrados no payload do JWT.', { status: 400 });
      }

      const { picture } = await Users.getUserData({ id: userData.id })

      async function generateUsername(email: string): Promise<string> {
        // Gera um nome de usuário único a partir do email
        let username = generateFromEmail(email);
        // Verifica se o nome de usuário já existe no MongoDB
        while (await getUserQuery({ username: username })) {
          username = generateFromEmail(email, 3);
        }
        return username;
      }

      const username = userData.username || await generateUsername(userData.email);

      // 4. Conectar ao MongoDB e inserir o usuário
      const result = await createUser({
        kindeId: userData.id, email: userData.email, username: username,
        firstName: userData.first_name, lastName: userData.last_name, picture: picture
      });

      console.log(`Usuário ${result.email} cadastrado/atualizado no MongoDB com sucesso.`);
    } else {
      console.log(`Evento recebido, mas não processado: ${eventType}`);
    }

    // // 5. Retornar uma resposta de sucesso para o Kinde
    return new NextResponse('Webhook JWT recebido e verificado com sucesso.', { status: 200 });

  } catch (error) {
    // Erros de verificação do JWT (assinatura inválida, expirado, etc.) serão capturados aqui
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error(`Erro ao processar o webhook JWT do Kinde: ${error}`);
    return new NextResponse(`Erro no webhook: ${message}`, { status: 401 }); // 401 Unauthorized é mais apropriado para falhas de verificação
  }
}
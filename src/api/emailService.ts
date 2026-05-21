import api from "./axiosConfig"; 

export interface SendEmailPayload {
  nomExpediteur: string;
  destinataire: string;
  sujet: string;
  contenu: string;
  associationId?: number;
}

export const sendEmail = async (payload: SendEmailPayload): Promise<void> => {
  await api.post("/v1/emails-envoyes", payload);
};
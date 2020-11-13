import { OAuth2Client } from "google-auth-library";
import Config from "../config/config";

class GoogleAuth {
  private client: OAuth2Client;
  private config: Config;

  constructor() {
    this.config = new Config();
    this.client = new OAuth2Client(this.config.googleApiClientId);
  }

  public async signIn(idToken: string): Promise<string> {
    const ticket = await this.client.verifyIdToken({
      idToken: idToken,
      audience: this.config.googleApiClientId,
    });
    const userId = ticket.getUserId();
    if (!userId) {
      throw new Error("User id is not available in signin ticket.");
    }

    return userId;
  }
}

export default GoogleAuth;

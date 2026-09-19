import { EmailVerification } from "./EmailVerification";
import { ForgotPassword } from "./ForgotPassword";
import { MagicLink } from "./MagicLink";
import { NewUser } from "./NewUser";
import { OrderConfirmation } from "./OrderConfirmation";
import { OrderFailed } from "./OrderFailed";
import { OrderRefunded } from "./OrderRefunded";
import { OrderShipped } from "./OrderShipped";
import { OrganizationInvitation } from "./OrganizationInvitation";

export const mailTemplates = {
	magicLink: MagicLink,
	forgotPassword: ForgotPassword,
	newUser: NewUser,
	organizationInvitation: OrganizationInvitation,
	emailVerification: EmailVerification,
	orderConfirmation: OrderConfirmation,
	orderFailed: OrderFailed,
	orderShipped: OrderShipped,
	orderRefunded: OrderRefunded,
} as const;

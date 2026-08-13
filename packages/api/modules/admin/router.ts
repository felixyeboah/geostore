import { createProductImageUploadUrl } from "./procedures/create-product-image-upload-url";
import { findOrganization } from "./procedures/find-organization";
import { listOrganizations } from "./procedures/list-organizations";
import { listUsers } from "./procedures/list-users";

export const adminRouter = {
	products: {
		imageUploadUrl: createProductImageUploadUrl,
	},
	users: {
		list: listUsers,
	},
	organizations: {
		list: listOrganizations,
		find: findOrganization,
	},
};

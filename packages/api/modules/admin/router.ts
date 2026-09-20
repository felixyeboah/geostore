import { createProductImageUploadUrl } from "./procedures/create-product-image-upload-url";
import { findOrganization } from "./procedures/find-organization";
import { listOrganizations } from "./procedures/list-organizations";
import { listUsers } from "./procedures/list-users";
import { searchProducts } from "./procedures/search-products";

export const adminRouter = {
	products: {
		imageUploadUrl: createProductImageUploadUrl,
		search: searchProducts,
	},
	users: {
		list: listUsers,
	},
	organizations: {
		list: listOrganizations,
		find: findOrganization,
	},
};

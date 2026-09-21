import { createProductImageUploadUrl } from "./procedures/create-product-image-upload-url";
import { deleteOrganization } from "./procedures/delete-organization";
import { findOrganization } from "./procedures/find-organization";
import { listAdminUsers } from "./procedures/list-admin-users";
import { listOrganizations } from "./procedures/list-organizations";
import { listUsers } from "./procedures/list-users";
import { searchProducts } from "./procedures/search-products";
import { updateAdminOrganization } from "./procedures/update-organization";

export const adminRouter = {
	products: {
		imageUploadUrl: createProductImageUploadUrl,
		search: searchProducts,
	},
	users: {
		list: listUsers,
		adminList: listAdminUsers,
	},
	organizations: {
		list: listOrganizations,
		find: findOrganization,
		update: updateAdminOrganization,
		delete: deleteOrganization,
	},
};

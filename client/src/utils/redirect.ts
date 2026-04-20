// src/utils/redirect.ts
export const getRedirectPath = (
    locationSearch: string,
    fallback: string = "/"
) => {
    const queryParams = new URLSearchParams(locationSearch);
    const redirect = queryParams.get("redirect");

    // Prevent open redirect attacks — only allow relative paths
    if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
        return redirect;
    }

    return fallback;
};

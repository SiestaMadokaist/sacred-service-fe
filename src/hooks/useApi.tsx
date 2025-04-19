import { useEffect, useMemo } from "react";
import { apiLambda, getAuth, Resource } from "../api/api";
import { ApiHub } from "../api/hub";
const navigate = (path: string) => {
  const { href } = window.location;
  const isHTML = href.endsWith('.html');
  if (isHTML) {
    window.location.href = `${path}.html?prev=${encodeURIComponent(href)}`;
  } else {
    window.location.href = `${path}?prev=${encodeURIComponent(href)}`;
  }
}

export const useLoginAPI = (hub: ApiHub, resource: Resource) => {
  useEffect(() => {
    hub.on('api-error', (error) => {
      if (error.statusCode === 401) {
        navigate("/");
      }
    })
  }, [hub, navigate]);
  const api = useMemo(() => apiLambda(resource, hub, getAuth()), [resource, hub]);
  return api;

}

export const useApi = (hub: ApiHub, resource: Resource) => {
  useEffect(() => {
    const auth = getAuth();
    if (!auth.token) {
      navigate("/");
      return;
    }
    hub.on('api-error', (error) => {
      if (error.statusCode === 401) {
        navigate("/");
      }
    })
  }, [hub, navigate]);
  const api = useMemo(() => apiLambda(resource, hub, getAuth()), [resource, hub]);
  return api;
}
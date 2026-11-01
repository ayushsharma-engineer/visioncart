"use client";

import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useRef, useState } from "react";

const API = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

type Address = {
  id: number;
  label: string;
  recipient_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
  is_default: boolean;
};

type AddressForm = Omit<Address, "id">;

const emptyForm: AddressForm = {
  label: "Home",
  recipient_name: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  landmark: "",
  city: "",
  state: "",
  postal_code: "",
  country: "India",
  latitude: null,
  longitude: null,
  is_default: false,
};

export default function AddressManager() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [mapMessage, setMapMessage] = useState("");
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);

  const mapElement = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);
  const leafletRef = useRef<any>(null);

  const token = () =>
    typeof window !== "undefined"
      ? localStorage.getItem("visioncart_access_token") || ""
      : "";

  const request = useCallback(async (path: string, options: RequestInit = {}) => {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token()}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
      cache: "no-store",
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result?.detail || "Address request failed");
    }
    return result.data;
  }, []);

  const loadAddresses = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await request("/api/addresses/");
      setAddresses(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load addresses");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const setField = (key: keyof AddressForm, value: string | boolean | number | null) => {
    setForm((old) => ({ ...old, [key]: value }));
  };

  const startNew = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      is_default: addresses.length === 0,
    });
    setError("");
    setNotice("");
    setMapMessage("");
    setFormOpen(true);
    setMapOpen(false);
  };

  const startEdit = (address: Address) => {
    const { id, ...values } = address;
    setEditingId(id);
    setForm({ ...emptyForm, ...values });
    setError("");
    setNotice("");
    setFormOpen(true);
    setMapOpen(false);
  };

  const saveAddress = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const path = editingId ? `/api/addresses/${editingId}` : "/api/addresses/";
      await request(path, {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(form),
      });

      await loadAddresses();
      setFormOpen(false);
      setEditingId(null);
      setNotice(editingId ? "Address updated successfully." : "Address saved successfully.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save address");
    } finally {
      setSaving(false);
    }
  };

  const deleteAddress = async (id: number) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      await request(`/api/addresses/${id}`, { method: "DELETE" });
      await loadAddresses();
      setNotice("Address deleted.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to delete address");
    }
  };

  const makeDefault = async (id: number) => {
    try {
      await request(`/api/addresses/${id}/default`, { method: "PATCH" });
      await loadAddresses();
      setNotice("Default delivery address updated.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to update default address");
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    setForm((old) => ({ ...old, latitude: lat, longitude: lng }));
    setMapMessage("Finding address...");

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { Accept: "application/json" } }
      );

      if (!response.ok) throw new Error("Address lookup unavailable");

      const data = await response.json();
      const a = data.address || {};

      const locality =
        a.village ||
        a.hamlet ||
        a.suburb ||
        a.neighbourhood ||
        a.road ||
        "";

      const city =
        a.city ||
        a.municipality ||
        a.county ||
        a.state_district ||
        a.town ||
        oldCityFallback();

      function oldCityFallback() {
        return "";
      }

      setForm((old) => ({
        ...old,
        latitude: lat,
        longitude: lng,
        address_line1:
          a.house_number
            ? `${a.house_number} ${a.road || ""}`.trim()
            : a.road || data.name || data.display_name?.split(",")[0] || old.address_line1,
        address_line2: [locality, a.neighbourhood, a.suburb]
          .filter((value, index, array) => value && array.indexOf(value) === index)
          .join(", ") || old.address_line2,
        city: city || old.city,
        state: a.state || old.state,
        postal_code: a.postcode || old.postal_code,
        country: a.country || old.country,
      }));

      setMapMessage("Location selected. Please verify the address details.");
    } catch {
      setMapMessage("Coordinates saved. Please enter the address details manually.");
    }
  };

  useEffect(() => {
    if (!mapOpen || !mapElement.current) return;

    let cancelled = false;

    const initializeMap = async () => {
      const L = await import("leaflet");
      if (cancelled || !mapElement.current) return;

      leafletRef.current = L;

      const lat = Number(form.latitude) || 26.9124;
      const lng = Number(form.longitude) || 75.7873;

      if (!mapInstance.current) {
        const map = L.map(mapElement.current).setView([lat, lng], 14);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        const icon = L.icon({
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        });

        const marker = L.marker([lat, lng], {
          draggable: true,
          icon,
        }).addTo(map);

        map.on("click", (event: any) => {
          marker.setLatLng(event.latlng);
          void reverseGeocode(event.latlng.lat, event.latlng.lng);
        });

        marker.on("dragend", () => {
          const position = marker.getLatLng();
          void reverseGeocode(position.lat, position.lng);
        });

        mapInstance.current = map;
        markerInstance.current = marker;
      } else {
        mapInstance.current.setView([lat, lng], 15);
        markerInstance.current.setLatLng([lat, lng]);
        setTimeout(() => mapInstance.current?.invalidateSize(), 100);
      }

      setTimeout(() => mapInstance.current?.invalidateSize(), 100);
    };

    void initializeMap();

    return () => {
      cancelled = true;
    };
  }, [mapOpen]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMapMessage("Your browser does not support GPS location.");
      return;
    }

    setMapMessage("Getting your current location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        mapInstance.current?.setView([lat, lng], 17);
        markerInstance.current?.setLatLng([lat, lng]);
        void reverseGeocode(lat, lng);
      },
      (err) => {
        setMapMessage(
          err.code === 1
            ? "Location permission denied. Allow location access in your browser."
            : "Unable to get location. Search for an address instead."
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const searchAddress = async () => {
    const query = search.trim();
    if (!query) return;

    setSearching(true);
    setMapMessage("Searching address...");

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=1&countrycodes=in&q=${encodeURIComponent(query)}`,
        { headers: { Accept: "application/json" } }
      );

      if (!response.ok) throw new Error("Search unavailable");
      const results = await response.json();

      if (!results.length) {
        setMapMessage("No matching address found. Try another search.");
        return;
      }

      const result = results[0];
      const lat = Number(result.lat);
      const lng = Number(result.lon);

      mapInstance.current?.setView([lat, lng], 16);
      markerInstance.current?.setLatLng([lat, lng]);
      await reverseGeocode(lat, lng);
    } catch {
      setMapMessage("Address search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="mt-6 space-y-5">
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{notice}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">Save addresses for faster checkout.</p>
        <button type="button" onClick={startNew} className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white">
          + Add New Address
        </button>
      </div>

      {loading ? (
        <p className="py-8 text-center text-gray-500">Loading saved addresses...</p>
      ) : addresses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
          <p className="font-semibold">No saved addresses yet</p>
          <p className="mt-2 text-sm text-gray-500">Add your first delivery address.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <article key={address.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex justify-between gap-2">
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">{address.label}</span>
                {address.is_default && <span className="text-xs font-semibold text-green-700">DEFAULT</span>}
              </div>
              <h3 className="mt-3 font-semibold">{address.recipient_name}</h3>
              <p className="mt-1 text-sm leading-6 text-gray-600">
                {address.address_line1}{address.address_line2 ? `, ${address.address_line2}` : ""}
                {address.landmark ? `, ${address.landmark}` : ""}, {address.city}, {address.state} {address.postal_code}, {address.country}
              </p>
              <p className="mt-2 text-sm text-gray-600">Phone: {address.phone}</p>
              <div className="mt-4 flex flex-wrap gap-3 border-t pt-3 text-sm">
                <button type="button" onClick={() => startEdit(address)} className="font-semibold text-blue-700">Edit</button>
                <button type="button" onClick={() => deleteAddress(address.id)} className="font-semibold text-red-600">Delete</button>
                {!address.is_default && (
                  <button type="button" onClick={() => makeDefault(address.id)} className="font-semibold">Set as default</button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {formOpen && (
        <form onSubmit={saveAddress} className="rounded-2xl border bg-gray-50 p-5 sm:p-6">
          <div className="flex justify-between gap-3">
            <h3 className="text-lg font-bold">{editingId ? "Edit Address" : "Add Delivery Address"}</h3>
            <button type="button" onClick={() => setFormOpen(false)} className="text-sm text-gray-500">Cancel</button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium">Address type
              <select value={form.label} onChange={(e) => setField("label", e.target.value)} className="mt-1 w-full rounded-lg border bg-white px-3 py-3">
                <option>Home</option><option>Work</option><option>Other</option>
              </select>
            </label>
            <label className="text-sm font-medium">Receiver name
              <input required maxLength={100} value={form.recipient_name} onChange={(e) => setField("recipient_name", e.target.value)} className="mt-1 w-full rounded-lg border bg-white px-3 py-3" />
            </label>
            <label className="text-sm font-medium">Phone number
              <input required minLength={7} maxLength={20} value={form.phone} onChange={(e) => setField("phone", e.target.value)} className="mt-1 w-full rounded-lg border bg-white px-3 py-3" />
            </label>
            <div className="flex items-end">
              <button type="button" onClick={() => { setMapOpen(!mapOpen); setMapMessage(""); }} className="w-full rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
                {mapOpen ? "Hide Map" : "Choose location on map"}
              </button>
            </div>
          </div>

          {mapOpen && (
            <div className="mt-4 rounded-xl border bg-white p-3">
              <div className="flex flex-wrap gap-2">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void searchAddress(); } }}
                  placeholder="Search area, street or place..."
                  className="min-w-0 flex-1 rounded-lg border px-3 py-3 text-sm"
                />
                <button type="button" disabled={searching} onClick={searchAddress} className="rounded-lg border px-4 py-3 text-sm font-semibold disabled:opacity-50">
                  {searching ? "Searching..." : "Search"}
                </button>
                <button type="button" onClick={useCurrentLocation} className="rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold text-white">
                  Use my current location
                </button>
              </div>

              <div ref={mapElement} className="mt-3 h-80 w-full rounded-lg bg-gray-100" />
              <p className="mt-2 text-xs text-gray-500">Click the map or drag the pin to adjust your delivery location.</p>
              {mapMessage && <p className="mt-2 text-sm text-blue-700">{mapMessage}</p>}
              {form.latitude != null && form.longitude != null && (
                <p className="mt-2 text-xs text-gray-500">Coordinates: {form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}</p>
              )}
            </div>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium sm:col-span-2">House / Flat / Building / Street
              <input required maxLength={255} value={form.address_line1} onChange={(e) => setField("address_line1", e.target.value)} className="mt-1 w-full rounded-lg border bg-white px-3 py-3" />
            </label>
            <label className="text-sm font-medium">Area / Locality
              <input value={form.address_line2 || ""} onChange={(e) => setField("address_line2", e.target.value)} className="mt-1 w-full rounded-lg border bg-white px-3 py-3" />
            </label>
            <label className="text-sm font-medium">Landmark
              <input value={form.landmark || ""} onChange={(e) => setField("landmark", e.target.value)} className="mt-1 w-full rounded-lg border bg-white px-3 py-3" />
            </label>
            <label className="text-sm font-medium">City
              <input required value={form.city} onChange={(e) => setField("city", e.target.value)} className="mt-1 w-full rounded-lg border bg-white px-3 py-3" />
            </label>
            <label className="text-sm font-medium">State
              <input required value={form.state} onChange={(e) => setField("state", e.target.value)} className="mt-1 w-full rounded-lg border bg-white px-3 py-3" />
            </label>
            <label className="text-sm font-medium">PIN code
              <input required value={form.postal_code} onChange={(e) => setField("postal_code", e.target.value)} className="mt-1 w-full rounded-lg border bg-white px-3 py-3" />
            </label>
            <label className="text-sm font-medium">Country
              <input required value={form.country} onChange={(e) => setField("country", e.target.value)} className="mt-1 w-full rounded-lg border bg-white px-3 py-3" />
            </label>
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_default} onChange={(e) => setField("is_default", e.target.checked)} />
            Set as my default delivery address
          </label>

          <button disabled={saving} type="submit" className="mt-5 rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60">
            {saving ? "Saving..." : editingId ? "Update Address" : "Save Address"}
          </button>
        </form>
      )}
    </div>
  );
}
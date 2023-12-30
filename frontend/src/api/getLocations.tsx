import { Component, JSXElement, createSignal } from "solid-js";
import { SLocation } from "../models/models";
import { toast } from "solid-toast";
import { API } from "./api";
interface GetLocationProps {
  id: number;
}

export const GetLocationById: Component<GetLocationProps> = (
  props: GetLocationProps,
): JSXElement => {
  let [locationName, setLocationName] = createSignal<
    string | number | undefined
  >("");

  API.GET(`locations/${props.id}`)
    .then((response) => {
      if (response && response!.success && response!.data) {
        setLocationName(response!.data!.at(0)!.name);
      } else {
        setLocationName("Error");
      }
    })
    .catch((err) => {
      console.error(err);
    });

  return <>{locationName()}</>;
};

export const GetAllLocations = async (): Promise<SLocation[]> => {
  let locResp = API.GET(`locations?all=true`).catch((err) => {
    toast.error("Error Getting List Of Locations.");
    console.error(err);
  });

  if (locResp) {
    let locData = await locResp;
    if (!locData) {
      toast.error("Error Getting List Of Locations.");
      return [];
    }
    if (locData.success && locData.data) {
      console.log("Got Array Of All Locations: ", locData.data);
      return locData.data as SLocation[];
    } else {
      toast.error(locData!.message);
      return [];
    }
  } else {
    toast.error("Error Getting List Of Locations. ");
    console.error("Error Getting List Of Locations.", locResp);
    return [];
  }
};

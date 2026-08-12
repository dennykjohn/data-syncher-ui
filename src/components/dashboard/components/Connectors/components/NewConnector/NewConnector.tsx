import { useEffect, useReducer } from "react";

import { Flex } from "@chakra-ui/react";

import { useLocation, useNavigate, useParams } from "react-router";

import ConnectorConfiguration from "./components/ConnectorConfiguration/ConnectorConfiguration";
import S3ConnectorConfiguration from "./components/ConnectorConfiguration/S3ConnectorConfiguration";
import DestinationSelection from "./components/DestinationSelection/DestinationSelection";
import SourceSelection from "./components/SourceSelection/SourceSelection";
import { connectorFormReducer, initialState } from "./reducer";

const getSavedGoogleDriveDestination = () => {
  try {
    const saved = sessionStorage.getItem("gdrive_form_values");
    if (!saved) return null;
    const parsed = JSON.parse(saved) as { destination_schema?: string };
    return parsed.destination_schema || null;
  } catch {
    return null;
  }
};

const NewConnector = () => {
  const { destination, source } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const initialDestination = destination
    ? decodeURIComponent(destination)
    : getSavedGoogleDriveDestination();
  const initialSource = source ? decodeURIComponent(source) : null;

  let initialStep = 1;
  if (initialDestination && initialSource) initialStep = 3;
  else if (initialDestination) initialStep = 2;

  const [state, dispatch] = useReducer(connectorFormReducer, {
    ...initialState,
    currentStep: initialStep,
    destination: initialDestination,
    source: initialSource,
  });

  useEffect(() => {
    let newPath = "/dashboard/connectors/add";

    if (state.currentStep >= 2 && state.destination) {
      newPath += "/select-destination";
      if (state.currentStep === 3 && state.source) {
        newPath += `/${encodeURIComponent(state.source)}`;
      }
    }

    if (location.pathname !== newPath) {
      navigate(newPath, { replace: true });
    }
  }, [
    state.currentStep,
    state.destination,
    state.source,
    navigate,
    location.pathname,
  ]);

  const handleNext = () => dispatch({ type: "NEXT_STEP" });
  const handlePrevious = () => dispatch({ type: "PREVIOUS_STEP" });

  const handleStepClick = (stepId: number) => {
    // Allow navigation to previous steps only
    if (stepId <= state.currentStep) {
      dispatch({ type: "SET_STEP", step: stepId });
    }
  };

  const handleSourceSelect = (sourceParam: string) => {
    dispatch({ type: "SET_SOURCE", source: sourceParam });
    handleNext();
  };

  const handleDestinationSelect = (destinationParam: string) => {
    dispatch({ type: "SET_DESTINATION", destination: destinationParam });
    handleNext();
  };

  const isStepCompleted = (stepId: number) => {
    switch (stepId) {
      case 1:
        return !!state.destination;
      case 2:
        return !!state.source;
      case 3:
        return Object.keys(state.configuration).length > 0;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (state.currentStep) {
      case 1:
        return (
          <DestinationSelection
            selectedDestination={state.destination}
            onDestinationSelect={handleDestinationSelect}
          />
        );
      case 2:
        if (!state.destination) handleStepClick(1);
        return (
          <>
            {state.destination ? (
              <SourceSelection
                selectedSource={state.source}
                onSourceSelect={handleSourceSelect}
                handlePrevious={handlePrevious}
              />
            ) : (
              <Flex>Please Choose a Destination</Flex>
            )}
          </>
        );
      case 3: {
        if (!isStepCompleted(2)) return null;

        // Determine if this source should use the file-based connector flow.
        const normalizedSource = state.source
          ?.toLowerCase()
          .replace(/[\s\-._]/g, "");
        const isS3Connector =
          normalizedSource === "amazons3" ||
          normalizedSource === "sftp" ||
          normalizedSource === "googledrive";

        // Route to appropriate configuration component
        return isS3Connector ? (
          <S3ConnectorConfiguration
            state={state}
            handlePrevious={handlePrevious}
            mode="create"
          />
        ) : (
          <ConnectorConfiguration
            state={state}
            handlePrevious={handlePrevious}
            mode="create"
          />
        );
      }
      default:
        return null;
    }
  };

  return <Flex direction="column">{renderStepContent()}</Flex>;
};
export default NewConnector;

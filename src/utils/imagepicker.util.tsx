import {
  Asset,
  launchCamera,
  launchImageLibrary,
} from 'react-native-image-picker';

class ImagePickerUtil {
  public async launchCamera(): Promise<Asset> {
    return await new Promise((resolve, reject) => {
      launchCamera(
        {
          mediaType: 'photo',
          cameraType: 'back',
        },
        response => {
          if (response.didCancel) {
            reject('User cancelled camera picker');
          } else if (response.errorMessage) {
            reject('ImagePicker Error: ' + response.errorMessage);
          } else if (!response.assets) {
            reject('User cancelled camera picker');
          } else {
            resolve(response.assets![0]!);
          }
        },
      );
    });
  }
  public async launchImageLibrary(selectionlimit: number = 1): Promise<Asset[]> {
    return await new Promise((resolve, reject) => {
      launchImageLibrary(
        {
          mediaType: 'photo',
          selectionLimit: selectionlimit,
        },
        response => {
          if (response.didCancel) {
            reject('User cancelled image picker');
          } else if (response.errorMessage) {
            reject('ImagePicker Error: ' + response.errorMessage);
          } else if (!response.assets) {
            reject('User cancelled camera picker');
          } else {
            resolve(response.assets!);
          }
        },
      );
    });
  }
}

export const imagepickerutil = new ImagePickerUtil();
